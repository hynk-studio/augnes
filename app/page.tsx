import { redirect } from "next/navigation";

import { openDatabase } from "@/lib/db";
import { readProjectHomeEntryDestinationV01 } from "@/lib/vnext/project-home/project-home-projection";

export const dynamic = "force-dynamic";

export default async function Home() {
  const db = openDatabase();
  let destination: string;
  try {
    destination = readProjectHomeEntryDestinationV01(db);
  } finally {
    db.close();
  }
  redirect(destination);
}
