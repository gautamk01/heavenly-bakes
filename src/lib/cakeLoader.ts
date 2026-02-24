import { db } from "./firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { CAKE_DATA } from "./cakeData";
import type { CakeData } from "@/types/cake";

let cachedData: CakeData[] | null = null;

export async function loadCakeData(): Promise<CakeData[]> {
  if (cachedData) return cachedData;

  try {
    const q = query(collection(db, "cakes"), orderBy("order", "asc"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      cachedData = CAKE_DATA;
    } else {
      cachedData = snapshot.docs.map((d) => ({
        id: Number(d.id),
        ...d.data(),
      })) as CakeData[];
    }
  } catch (err) {
    console.warn(
      "Firestore fetch failed, using static data:",
      (err as Error).message
    );
    cachedData = CAKE_DATA;
  }

  return cachedData ?? CAKE_DATA;
}
