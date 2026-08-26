#ifndef UNICODE
#define UNICODE
#endif
#ifndef _UNICODE
#define _UNICODE
#endif
#ifndef _WIN32_WINNT
#define _WIN32_WINNT 0x0A00
#endif

#include <windows.h>

#include <array>
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>

#if !defined(_M_X64) && !defined(__x86_64__)
#error "The CDX2B3A Windows physical-root helper supports x64 only."
#endif

namespace {

constexpr wchar_t kContract[] = L"augnes.windows_physical_root_helper.v0.1";
constexpr std::size_t kMaximumPathCharacters = 32768;
constexpr std::size_t kMaximumPathComponents = 1024;

class Handle final {
 public:
  explicit Handle(HANDLE value) : value_(value) {}
  ~Handle() {
    if (value_ != INVALID_HANDLE_VALUE) CloseHandle(value_);
  }
  Handle(const Handle&) = delete;
  Handle& operator=(const Handle&) = delete;
  HANDLE get() const { return value_; }

 private:
  HANDLE value_;
};

int Fail(const char* code) {
  std::cout
      << "{\"contract\":\"augnes.windows_physical_root_helper.v0.1\","
      << "\"status\":\"error\",\"code\":\"" << code << "\"}\n";
  return 1;
}

bool StartsWith(const std::wstring& value, const wchar_t* prefix) {
  return value.rfind(prefix, 0) == 0;
}

std::wstring PrepareLongPath(const std::wstring& input) {
  if (StartsWith(input, L"\\\\?\\")) return input;
  const DWORD required = GetFullPathNameW(input.c_str(), 0, nullptr, nullptr);
  if (required == 0 || required > static_cast<DWORD>(kMaximumPathCharacters)) {
    return {};
  }
  std::vector<wchar_t> buffer(static_cast<std::size_t>(required) + 1);
  const DWORD written = GetFullPathNameW(
      input.c_str(), static_cast<DWORD>(buffer.size()), buffer.data(), nullptr);
  if (written == 0 || written >= static_cast<DWORD>(buffer.size())) return {};
  std::wstring absolute(buffer.data(), written);
  if (StartsWith(absolute, L"\\\\")) return L"\\\\?\\UNC\\" + absolute.substr(2);
  if (absolute.size() >= 3 && absolute[1] == L':' && absolute[2] == L'\\') {
    return L"\\\\?\\" + absolute;
  }
  return {};
}

std::wstring ReadFinalTarget(HANDLE handle) {
  constexpr DWORD flags = FILE_NAME_NORMALIZED | VOLUME_NAME_DOS;
  const DWORD required = GetFinalPathNameByHandleW(handle, nullptr, 0, flags);
  if (required == 0 || required > static_cast<DWORD>(kMaximumPathCharacters)) {
    return {};
  }
  std::vector<wchar_t> buffer(static_cast<std::size_t>(required) + 1);
  const DWORD written = GetFinalPathNameByHandleW(
      handle, buffer.data(), static_cast<DWORD>(buffer.size()), flags);
  if (written == 0 || written >= static_cast<DWORD>(buffer.size())) return {};
  return std::wstring(buffer.data(), written);
}

std::string Utf8(const std::wstring& value) {
  if (value.empty()) return {};
  const int required = WideCharToMultiByte(
      CP_UTF8, WC_ERR_INVALID_CHARS, value.data(), static_cast<int>(value.size()),
      nullptr, 0, nullptr, nullptr);
  if (required <= 0) return {};
  std::string output(static_cast<std::size_t>(required), '\0');
  const int written = WideCharToMultiByte(
      CP_UTF8, WC_ERR_INVALID_CHARS, value.data(), static_cast<int>(value.size()),
      output.data(), required, nullptr, nullptr);
  return written == required ? output : std::string{};
}

std::string JsonEscape(const std::string& value) {
  std::ostringstream output;
  for (const unsigned char character : value) {
    switch (character) {
      case '\"': output << "\\\""; break;
      case '\\': output << "\\\\"; break;
      case '\b': output << "\\b"; break;
      case '\f': output << "\\f"; break;
      case '\n': output << "\\n"; break;
      case '\r': output << "\\r"; break;
      case '\t': output << "\\t"; break;
      default:
        if (character < 0x20) {
          output << "\\u" << std::hex << std::setw(4) << std::setfill('0')
                 << static_cast<unsigned int>(character) << std::dec;
        } else {
          output << static_cast<char>(character);
        }
    }
  }
  return output.str();
}

std::string Hex64(std::uint64_t value) {
  std::ostringstream output;
  output << std::hex << std::setw(16) << std::setfill('0') << value;
  return output.str();
}

std::string HexFileId(const FILE_ID_128& value) {
  std::ostringstream output;
  output << std::hex << std::setfill('0');
  for (const unsigned char byte : value.Identifier) {
    output << std::setw(2) << static_cast<unsigned int>(byte);
  }
  return output.str();
}

bool EqualAsciiInsensitive(const std::wstring& left, const wchar_t* right) {
  const std::wstring expected(right);
  return left.size() == expected.size() &&
      CompareStringOrdinal(
          left.c_str(), static_cast<int>(left.size()), expected.c_str(),
          static_cast<int>(expected.size()), TRUE) == CSTR_EQUAL;
}

enum class RequestedPathClassification {
  kSupported,
  kUnavailable,
  kUnsupported,
  kAmbiguous,
};

RequestedPathClassification ClassifyPathComponent(const std::wstring& path) {
  const DWORD attributes = GetFileAttributesW(path.c_str());
  if (attributes == INVALID_FILE_ATTRIBUTES) {
    return RequestedPathClassification::kUnavailable;
  }
  if ((attributes & FILE_ATTRIBUTE_REPARSE_POINT) == 0) {
    return RequestedPathClassification::kSupported;
  }
  Handle reparse_point(CreateFileW(
      path.c_str(), FILE_READ_ATTRIBUTES,
      FILE_SHARE_READ | FILE_SHARE_WRITE | FILE_SHARE_DELETE, nullptr,
      OPEN_EXISTING,
      FILE_FLAG_BACKUP_SEMANTICS | FILE_FLAG_OPEN_REPARSE_POINT, nullptr));
  if (reparse_point.get() == INVALID_HANDLE_VALUE) {
    return RequestedPathClassification::kUnavailable;
  }
  FILE_ATTRIBUTE_TAG_INFO tag_info{};
  if (!GetFileInformationByHandleEx(
          reparse_point.get(), FileAttributeTagInfo, &tag_info,
          static_cast<DWORD>(sizeof(tag_info)))) {
    return RequestedPathClassification::kUnavailable;
  }
  return tag_info.ReparseTag == IO_REPARSE_TAG_SYMLINK ||
          tag_info.ReparseTag == IO_REPARSE_TAG_MOUNT_POINT
      ? RequestedPathClassification::kSupported
      : RequestedPathClassification::kUnsupported;
}

RequestedPathClassification ClassifyPathComponents(const std::wstring& path) {
  if (
      path.size() < 7 || !StartsWith(path, L"\\\\?\\") || path[5] != L':' ||
      path[6] != L'\\') {
    return RequestedPathClassification::kAmbiguous;
  }
  std::wstring current(path.substr(0, 7));
  RequestedPathClassification classification = ClassifyPathComponent(current);
  if (classification != RequestedPathClassification::kSupported) {
    return classification;
  }
  std::size_t component_count = 0;
  std::size_t component_start = 7;
  while (component_start < path.size()) {
    const std::size_t component_end = path.find(L'\\', component_start);
    const std::size_t component_length =
        (component_end == std::wstring::npos ? path.size() : component_end) -
        component_start;
    if (component_length == 0) {
      component_start = component_end == std::wstring::npos
          ? path.size()
          : component_end + 1;
      continue;
    }
    if (++component_count > kMaximumPathComponents) {
      return RequestedPathClassification::kAmbiguous;
    }
    if (current.back() != L'\\') current.push_back(L'\\');
    current.append(path, component_start, component_length);
    classification = ClassifyPathComponent(current);
    if (classification != RequestedPathClassification::kSupported) {
      return classification;
    }
    component_start = component_end == std::wstring::npos
        ? path.size()
        : component_end + 1;
  }
  return RequestedPathClassification::kSupported;
}

}  // namespace

int wmain(int argc, wchar_t* argv[]) {
  if (
      argc != 5 || std::wstring(argv[1]) != L"--contract" ||
      std::wstring(argv[2]) != kContract || std::wstring(argv[3]) != L"--path") {
    return Fail("request_invalid");
  }
  const std::wstring requested_path(argv[4]);
  if (requested_path.empty() || requested_path.size() > kMaximumPathCharacters) {
    return Fail("path_invalid");
  }
  const std::wstring long_path = PrepareLongPath(requested_path);
  if (long_path.empty()) return Fail("path_invalid");
  if (StartsWith(long_path, L"\\\\?\\UNC\\")) {
    return Fail("network_path_unsupported");
  }
  const RequestedPathClassification requested_path_classification =
      ClassifyPathComponents(long_path);
  if (requested_path_classification == RequestedPathClassification::kUnavailable) {
    return Fail("reparse_ancestor_unavailable");
  }
  if (requested_path_classification == RequestedPathClassification::kUnsupported) {
    return Fail("reparse_ancestor_unsupported");
  }
  if (requested_path_classification == RequestedPathClassification::kAmbiguous) {
    return Fail("reparse_ancestor_ambiguous");
  }

  Handle directory(CreateFileW(
      long_path.c_str(), FILE_READ_ATTRIBUTES,
      FILE_SHARE_READ | FILE_SHARE_WRITE | FILE_SHARE_DELETE, nullptr,
      OPEN_EXISTING, FILE_FLAG_BACKUP_SEMANTICS, nullptr));
  if (directory.get() == INVALID_HANDLE_VALUE) {
    return GetLastError() == ERROR_CANT_RESOLVE_FILENAME
        ? Fail("reparse_target_ambiguous")
        : Fail("directory_open_failed");
  }

  FILE_STANDARD_INFO standard_info{};
  if (!GetFileInformationByHandleEx(
          directory.get(), FileStandardInfo, &standard_info,
          static_cast<DWORD>(sizeof(standard_info))) || !standard_info.Directory) {
    return Fail("not_directory");
  }

  const std::wstring final_target = ReadFinalTarget(directory.get());
  if (final_target.empty()) return Fail("final_target_unavailable");
  if (StartsWith(final_target, L"\\\\?\\UNC\\")) {
    return Fail("network_target_unsupported");
  }
  if (
      final_target.size() < 7 || !StartsWith(final_target, L"\\\\?\\") ||
      final_target[5] != L':' || final_target[6] != L'\\') {
    return Fail("final_target_ambiguous");
  }
  const RequestedPathClassification final_target_classification =
      ClassifyPathComponents(final_target);
  if (final_target_classification == RequestedPathClassification::kUnavailable) {
    return Fail("reparse_ancestor_unavailable");
  }
  if (final_target_classification == RequestedPathClassification::kUnsupported) {
    return Fail("reparse_ancestor_unsupported");
  }
  if (final_target_classification == RequestedPathClassification::kAmbiguous) {
    return Fail("reparse_ancestor_ambiguous");
  }

  FILE_ID_INFO file_id{};
  if (!GetFileInformationByHandleEx(
          directory.get(), FileIdInfo, &file_id,
          static_cast<DWORD>(sizeof(file_id)))) {
    return Fail("file_identity_unavailable");
  }

  FILE_ATTRIBUTE_TAG_INFO tag_info{};
  if (!GetFileInformationByHandleEx(
          directory.get(), FileAttributeTagInfo, &tag_info,
          static_cast<DWORD>(sizeof(tag_info)))) {
    return Fail("reparse_classification_unavailable");
  }
  if (
      (tag_info.FileAttributes & FILE_ATTRIBUTE_REPARSE_POINT) != 0 &&
      tag_info.ReparseTag != IO_REPARSE_TAG_SYMLINK &&
      tag_info.ReparseTag != IO_REPARSE_TAG_MOUNT_POINT) {
    return Fail("reparse_target_unsupported");
  }

  std::array<wchar_t, MAX_PATH + 1> filesystem_name{};
  if (!GetVolumeInformationByHandleW(
          directory.get(), nullptr, 0, nullptr, nullptr, nullptr,
          filesystem_name.data(), static_cast<DWORD>(filesystem_name.size()))) {
    return Fail("filesystem_classification_unavailable");
  }
  const std::wstring filesystem(filesystem_name.data());
  if (!EqualAsciiInsensitive(filesystem, L"NTFS")) {
    return Fail("filesystem_unsupported");
  }

  const std::wstring volume_root = final_target.substr(4, 3);
  if (GetDriveTypeW(volume_root.c_str()) != DRIVE_FIXED) {
    return Fail("drive_type_unsupported");
  }

  const std::string final_utf8 = Utf8(final_target);
  if (final_utf8.empty()) return Fail("final_target_encoding_invalid");
  std::cout
      << "{\"architecture\":\"x64\","
      << "\"contract\":\"augnes.windows_physical_root_helper.v0.1\","
      << "\"drive_type\":\"fixed\","
      << "\"file_id\":\"" << HexFileId(file_id.FileId) << "\","
      << "\"filesystem_family\":\"NTFS\","
      << "\"final_target_path\":\"" << JsonEscape(final_utf8) << "\","
      << "\"identity_version\":\"physical_root_identity.windows.v0.1\","
      << "\"platform\":\"win32\","
      << "\"status\":\"exact\","
      << "\"volume_serial_identity\":\""
      << Hex64(file_id.VolumeSerialNumber) << "\"}\n";
  return 0;
}
