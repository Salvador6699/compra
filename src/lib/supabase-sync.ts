import { supabase } from "./supabase";
import { useShoppingStoreBase, type Store, type Item, type CompletedTrip } from "./use-shopping-store";

// ==========================================
// DATA PULL (Supabase -> Local)
// ==========================================

export async function pullStore(): Promise<Partial<Store> | null> {
  const { data: settings } = await supabase.from("compra_app_settings").select("*").eq("id", 1).single();

  const { data: dbItems } = await supabase
    .from("compra_items")
    .select(`
      *,
      compra_product_formats (*)
    `);

  const { data: tripsData } = await supabase.from("compra_completed_trips").select(`*, compra_trip_items (*)`);

  const parsedItems: Item[] = [];
  
  if (dbItems) {
    for (const dbItem of dbItems) {
      parsedItems.push({
        id: dbItem.id,
        name: dbItem.name,
        category: dbItem.category as any,
        inList: dbItem.in_list,
        bought: dbItem.bought,
        preferredStore: dbItem.preferred_store,
        note: dbItem.note,
        quantity: Number(dbItem.quantity),
        selectedFormatId: dbItem.selected_format_id,
        formats: (dbItem.compra_product_formats || []).map((f: any) => ({
          id: f.id,
          barcode: f.barcode,
          name: f.name,
          size: Number(f.size),
          unit: f.unit as any,
          image: f.image,
          prices: f.prices || {},
        }))
      });
    }
  }

  const parsedTrips: CompletedTrip[] = (tripsData || []).map((dbTrip: any) => ({
    id: dbTrip.id,
    date: dbTrip.date,
    storeName: dbTrip.store_name,
    storeTotals: dbTrip.store_totals || {},
    grandTotal: Number(dbTrip.grand_total),
    receiptImage: dbTrip.receipt_image,
    note: dbTrip.note,
    items: (dbTrip.compra_trip_items || []).map((ti: any) => ({
      name: ti.name,
      category: ti.category,
      preferredStore: ti.preferred_store,
      price: ti.price ? Number(ti.price) : undefined,
      quantity: Number(ti.quantity),
      formatId: ti.format_id,
    }))
  }));

  return {
    items: parsedItems,
    trips: parsedTrips,
    customCategories: settings?.custom_categories || [],
    customStores: settings?.custom_stores || [],
    categoryIcons: settings?.category_icons || {},
    storeIcons: settings?.store_icons || {},
    deletedCategories: settings?.deleted_categories || [],
    deletedStores: settings?.deleted_stores || [],
  };
}

// ==========================================
// DATA PUSH (Local -> Supabase)
// ==========================================

export async function pushSettings(store: Store) {
  await supabase.from("compra_app_settings").upsert({
    id: 1,
    custom_categories: store.customCategories || [],
    custom_stores: store.customStores || [],
    category_icons: store.categoryIcons || {},
    store_icons: store.storeIcons || {},
    deleted_categories: store.deletedCategories || [],
    deleted_stores: store.deletedStores || [],
    updated_at: new Date().toISOString()
  });
}

export async function pushItem(item: Item) {
  // 1. Upsert the Item
  const { error: iErr } = await supabase.from("compra_items").upsert({
    id: item.id,
    name: item.name,
    category: item.category,
    in_list: item.inList,
    bought: item.bought,
    quantity: item.quantity || 1,
    note: item.note,
    preferred_store: item.preferredStore,
    selected_format_id: item.selectedFormatId,
    updated_at: new Date().toISOString()
  });
  if (iErr) console.error("Error upserting compra_items:", iErr);

  // 2. Formats & Prices
  for (const format of item.formats) {
    const { error: fErr } = await supabase.from("compra_product_formats").upsert({
      id: format.id,
      item_id: item.id,
      barcode: format.barcode,
      name: format.name,
      size: format.size,
      unit: format.unit,
      image: format.image,
      prices: format.prices
    });
    if (fErr) console.error("Error upserting format:", fErr);
  }
}

export async function deleteItemFromSupabase(itemId: string) {
  const { error } = await supabase.from("compra_items").delete().eq("id", itemId);
  if (error) console.error("Error deleting from items:", error);
}

export async function pushTrip(trip: CompletedTrip) {
  await supabase.from("compra_completed_trips").upsert({
    id: trip.id,
    date: trip.date,
    store_name: trip.storeName,
    store_totals: trip.storeTotals,
    grand_total: trip.grandTotal,
    receipt_image: trip.receiptImage,
    note: trip.note
  });

  const tripItemsRows = trip.items.map(ti => ({
    trip_id: trip.id,
    name: ti.name,
    category: ti.category,
    preferred_store: ti.preferredStore,
    price: ti.price,
    quantity: ti.quantity || 1,
    format_id: ti.formatId
  }));

  if (tripItemsRows.length > 0) {
    await supabase.from("compra_trip_items").delete().eq("trip_id", trip.id);
    await supabase.from("compra_trip_items").insert(tripItemsRows);
  }
}

export async function deleteTripFromSupabase(tripId: string) {
  await supabase.from("compra_completed_trips").delete().eq("id", tripId);
}

// ==========================================
// AUTO-SYNC LOGIC
// ==========================================

let isPulling = false;

export async function hydrateFromSupabase(): Promise<void> {
  isPulling = true;
  const remoteStore = await pullStore();
  if (remoteStore) {
    const localStore = useShoppingStoreBase.getState().store;
    
    // Protección contra borrado accidental:
    // Si Supabase está completamente vacío pero local tiene datos, 
    // asumimos que Supabase es nuevo/falló y subimos los datos locales.
    if (
      remoteStore.items?.length === 0 && 
      remoteStore.trips?.length === 0 && 
      (localStore.items.length > 0 || (localStore.trips && localStore.trips.length > 0))
    ) {
      console.warn("Supabase está vacío pero hay datos locales. Protegiendo y subiendo datos locales a la nube...");
      for (const item of localStore.items) {
        await pushItem(item);
      }
      if (localStore.trips) {
        for (const trip of localStore.trips) {
          await pushTrip(trip);
        }
      }
      await pushSettings(localStore);
    } else {
      useShoppingStoreBase.getState().setStore((s) => ({ ...s, ...remoteStore }));
    }
  }
  isPulling = false;
}

let realtimeChannel: any = null;

export function startRealtimeSync() {
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel);
  }

  // Escuchar cambios globales (ahora todo es de la misma "familia")
  realtimeChannel = supabase.channel('global-sync')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'compra_items' }, () => {
      if (!isPulling) hydrateFromSupabase();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'compra_product_formats' }, () => {
      if (!isPulling) hydrateFromSupabase();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'compra_app_settings' }, () => {
      if (!isPulling) hydrateFromSupabase();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'compra_completed_trips' }, () => {
      if (!isPulling) hydrateFromSupabase();
    })
    .subscribe();
}

// Subscripción global para autoguardado (Optimistic UI)
useShoppingStoreBase.subscribe(async (state, prevState) => {
  if (isPulling) return;

  const newState = state.store;
  const oldState = prevState.store;

  // Sync items
  newState.items.forEach(newItem => {
    const oldItem = oldState.items.find(i => i.id === newItem.id);
    if (oldItem !== newItem) pushItem(newItem);
  });

  // Items deleted locally -> Delete remote
  oldState.items.forEach(oldItem => {
    if (!newState.items.find(i => i.id === oldItem.id)) {
      deleteItemFromSupabase(oldItem.id);
    }
  });

  // Sync settings
  if (
    newState.customCategories !== oldState.customCategories ||
    newState.customStores !== oldState.customStores ||
    newState.categoryIcons !== oldState.categoryIcons ||
    newState.storeIcons !== oldState.storeIcons ||
    newState.deletedCategories !== oldState.deletedCategories ||
    newState.deletedStores !== oldState.deletedStores
  ) {
    pushSettings(newState);
  }

  // Sync trips
  (newState.trips || []).forEach(newTrip => {
    const oldTrip = (oldState.trips || []).find(t => t.id === newTrip.id);
    if (oldTrip !== newTrip) pushTrip(newTrip);
  });
  
  (oldState.trips || []).forEach(oldTrip => {
    if (!(newState.trips || []).find(t => t.id === oldTrip.id)) {
      deleteTripFromSupabase(oldTrip.id);
    }
  });
});
