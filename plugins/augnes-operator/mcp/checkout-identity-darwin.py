"""Read-only Darwin identity provider. Descriptor 3 is opened by the caller.

No paths, environment configuration, network, writes, or third-party modules.
The fixed fgetattrlist ABI and persistent-ID capability are documented by XNU.
"""
import ctypes
import json
import os
import stat
import struct
import sys
import uuid


class Attrlist(ctypes.Structure):
    _fields_ = [("count", ctypes.c_uint16), ("reserved", ctypes.c_uint16),
                ("common", ctypes.c_uint32), ("volume", ctypes.c_uint32),
                ("directory", ctypes.c_uint32), ("file", ctypes.c_uint32),
                ("fork", ctypes.c_uint32)]


def observe():
    if sys.platform != "darwin":
        raise ValueError("unsupported")
    libc = ctypes.CDLL("/usr/lib/libSystem.B.dylib", use_errno=True)
    call = libc.fgetattrlist
    call.argtypes = [ctypes.c_int, ctypes.POINTER(Attrlist), ctypes.c_void_p,
                     ctypes.c_size_t, ctypes.c_ulong]
    call.restype = ctypes.c_int

    def attr(common, volume, size):
        # RETURNED_ATTRS avoids treating an unsupported zero-filled field as data.
        request = Attrlist(5, 0, common | 0x80000000, volume, 0, 0, 0)
        buffer = ctypes.create_string_buffer(256)
        if call(3, ctypes.byref(request), buffer, len(buffer), 0) != 0:
            raise ValueError("unsupported")
        length, returned_common, returned_volume, _, _, _ = struct.unpack_from("=6I", buffer.raw)
        if (size is not None and length != 24 + size) or not 24 <= length <= 256 or returned_common & common != common or returned_volume & (volume & 0x7fffffff) != (volume & 0x7fffffff):
            raise ValueError("unsupported")
        return buffer.raw[24:length]

    before = os.fstat(3)
    if not stat.S_ISDIR(before.st_mode):
        raise ValueError("incoherent")
    name_data = attr(0, 0x80000000 | 0x00100000, None)
    offset, length = struct.unpack_from("=iI", name_data)
    if offset < 8 or length > 16 or offset + length > len(name_data):
        raise ValueError("unsupported")
    filesystem = name_data[offset:offset + length]
    if filesystem not in (b"apfs\x00", b"hfs\x00"):
        raise ValueError("unsupported")
    capabilities = struct.unpack("=8I", attr(0, 0x80000000 | 0x00020000, 32))
    if capabilities[0] & capabilities[4] & 0x4001 != 0x4001:
        raise ValueError("unsupported")
    volume = str(uuid.UUID(bytes=attr(0, 0x80000000 | 0x00040000, 16)))
    permanent = attr(0x00000040, 0, 8).hex()
    seconds, nanos = struct.unpack("=qq", attr(0x00000200, 0, 16))
    after = os.fstat(3)
    if (before.st_dev, before.st_ino, before.st_uid) != (after.st_dev, after.st_ino, after.st_uid):
        raise ValueError("incoherent")
    if volume == str(uuid.UUID(int=0)) or permanent == "0" * 16 or seconds <= 0 or not 0 <= nanos < 1000000000:
        raise ValueError("unsupported")
    return {"state": "observed", "durable": {
        "contract": "augnes.darwin-checkout-identity.v1", "filesystem": filesystem[:-1].decode("ascii"), "volume_uuid": volume,
        "object_id": permanent, "birth_seconds": str(seconds), "birth_nanoseconds": str(nanos),
        "object_id_format": "uint64" if capabilities[0] & capabilities[4] & 0x20000 else "fsobj_id_t"
    }, "device": str(after.st_dev), "inode": str(after.st_ino), "uid": after.st_uid}


try:
    print(json.dumps(observe(), separators=(",", ":")))
except Exception as error:
    category = str(error) if isinstance(error, ValueError) and str(error) in ("unsupported", "incoherent") else "unavailable"
    print(json.dumps({"state": category}, separators=(",", ":")))
    sys.exit(1)
