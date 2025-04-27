import config/sde
import gleam/dict.{type Dict}
import gleam/float
import gleam/int
import gleam/option.{type Option}
import gleam/result
import lustre/effect
import mvu
import util/numbers
import util/storage

// Get Store side effect

pub fn get_store() -> effect.Effect(mvu.Msg) {
  effect.from(fn(dispatch) {
    case storage.local() {
      Error(_) -> mvu.InitStoreLoadFailed
      Ok(store) -> mvu.InitLoadStorage(store)
    }
    |> dispatch
  })
}

// Write side effects

pub fn write_ship_name(
  storage: storage.Storage,
  ship_id: Int,
  new_name: String,
) -> effect.Effect(mvu.Msg) {
  store_write_to_effect(
    storage,
    get_ship_id_storage_key_string(ship_id) <> "/name",
    new_name,
  )
}

pub fn write_ship_hold_name(
  storage: storage.Storage,
  ship_id: Int,
  hold_id: Int,
  new_name: String,
) -> effect.Effect(mvu.Msg) {
  store_write_to_effect(
    storage,
    get_hold_id_storage_key_string(ship_id, hold_id) <> "/name",
    new_name,
  )
}

pub fn write_ship_hold_capacity(
  storage: storage.Storage,
  ship_id: Int,
  hold_id: Int,
  new_capacity: Float,
) -> effect.Effect(mvu.Msg) {
  store_write_to_effect(
    storage,
    get_hold_id_storage_key_string(ship_id, hold_id) <> "/capacity",
    new_capacity |> float.to_string,
  )
}

pub fn write_ship_hold_kind(
  storage: storage.Storage,
  ship_id: Int,
  hold_id: Int,
  new_kind: sde.HoldKind,
) -> effect.Effect(mvu.Msg) {
  store_write_to_effect(
    storage,
    get_hold_id_storage_key_string(ship_id, hold_id) <> "/kind",
    new_kind |> sde.hold_kind_to_string,
  )
}

pub fn write_collateral(
  storage: storage.Storage,
  collateral: Option(Int),
) -> effect.Effect(mvu.Msg) {
  let string_to_store =
    option.map(collateral, int.to_string) |> option.unwrap("")
  store_write_to_effect(storage, "collateral", string_to_store)
}

pub fn write_accounting_level(
  storage: storage.Storage,
  accounting_level: Int,
) -> effect.Effect(mvu.Msg) {
  store_write_to_effect(
    storage,
    "accounting_level",
    accounting_level |> int.to_string,
  )
}

// pub fn write_ship_indices(
//   storage: storage.Storage,
//   ship_indices: List(Int),
// ) -> effect.Effect(mvu.Msg) {
//   store_write_to_effect(
//     storage,
//     "ship_indices",
//     ship_indices |> numbers.ints_to_string,
//   )
// }

pub fn write_hold_indices(
  storage: storage.Storage,
  hold_indices: Dict(Int, List(Int)),
) -> effect.Effect(mvu.Msg) {
  store_write_to_effect(
    storage,
    "hold_indices",
    hold_indices |> numbers.ints_dict_to_string,
  )
}

pub fn write_selected_ship(
  storage: storage.Storage,
  ship_id: Option(Int),
) -> effect.Effect(mvu.Msg) {
  let ship_id_string =
    ship_id
    |> option.map(int.to_string)
    |> option.unwrap("")
  store_write_to_effect(storage, "selected_ship", ship_id_string)
}

// Read side effects

pub fn read_ship_name(
  storage: storage.Storage,
  ship_id: Int,
) -> effect.Effect(mvu.Msg) {
  store_read_to_effect(
    storage,
    get_ship_id_storage_key_string(ship_id) <> "/name",
    Ok,
    mvu.InitStoreReadShipName(_, ship_id),
  )
}

pub fn read_ship_hold_name(
  storage: storage.Storage,
  ship_id: Int,
  hold_id: Int,
) -> effect.Effect(mvu.Msg) {
  store_read_to_effect(
    storage,
    get_hold_id_storage_key_string(ship_id, hold_id) <> "/name",
    Ok,
    mvu.InitStoreReadHoldName(_, ship_id, hold_id),
  )
}

pub fn read_ship_hold_capacity(
  storage: storage.Storage,
  ship_id: Int,
  hold_id: Int,
) -> effect.Effect(mvu.Msg) {
  store_read_to_effect(
    storage,
    get_hold_id_storage_key_string(ship_id, hold_id) <> "/capacity",
    float.parse,
    mvu.InitStoreReadHoldCapacity(_, ship_id, hold_id),
  )
}

pub fn read_ship_hold_kind(
  storage: storage.Storage,
  ship_id: Int,
  hold_id: Int,
) -> effect.Effect(mvu.Msg) {
  store_read_to_effect(
    storage,
    get_hold_id_storage_key_string(ship_id, hold_id) <> "/kind",
    sde.hold_kind_from_string,
    mvu.InitStoreReadHoldKind(_, ship_id, hold_id),
  )
}

pub fn read_collateral(storage: storage.Storage) -> effect.Effect(mvu.Msg) {
  store_read_to_effect(
    storage,
    "collateral",
    fn(value) { int.parse(value) |> option.from_result |> Ok },
    mvu.InitStoreReadCollateral,
  )
}

pub fn read_accounting_level(storage: storage.Storage) -> effect.Effect(mvu.Msg) {
  store_read_to_effect(
    storage,
    "accounting_level",
    int.parse,
    mvu.InitStoreReadAccountingLevel,
  )
}

pub fn read_hold_indices(storage: storage.Storage) -> effect.Effect(mvu.Msg) {
  store_read_to_effect(
    storage,
    "hold_indices",
    numbers.string_to_ints_dict,
    mvu.InitStoreReadHoldIndices,
  )
}

pub fn read_selected_ship(storage: storage.Storage) -> effect.Effect(mvu.Msg) {
  store_read_to_effect(
    storage,
    "selected_ship",
    fn(value) { int.parse(value) |> option.from_result |> Ok },
    mvu.InitStoreReadSelectedShip,
  )
}

// Delete functions

pub fn delete_ship(
  storage: storage.Storage,
  ship_id: Int,
) -> effect.Effect(mvu.Msg) {
  effect.from(fn(_dispatch) {
    storage.remove_many_items(
      storage,
      get_ship_id_storage_key_string(ship_id) <> "*",
    )
  })
}

pub fn delete_hold(
  storage: storage.Storage,
  ship_id: Int,
  hold_id: Int,
) -> effect.Effect(mvu.Msg) {
  effect.from(fn(_dispatch) {
    storage.remove_many_items(
      storage,
      get_hold_id_storage_key_string(ship_id, hold_id) <> "*",
    )
  })
}

pub fn delete_ship_name(
  storage: storage.Storage,
  ship_id: Int,
) -> effect.Effect(mvu.Msg) {
  effect.from(fn(_dispatch) {
    storage.remove_item(
      storage,
      get_ship_id_storage_key_string(ship_id) <> "/name",
    )
  })
}

pub fn delete_ship_hold(
  storage: storage.Storage,
  ship_id: Int,
  hold_id: Int,
) -> effect.Effect(mvu.Msg) {
  effect.from(fn(_dispatch) {
    storage.remove_item(
      storage,
      echo get_hold_id_storage_key_string(ship_id, hold_id) <> "/name",
    )
    storage.remove_item(
      storage,
      get_hold_id_storage_key_string(ship_id, hold_id) <> "/capacity",
    )
    storage.remove_item(
      storage,
      get_hold_id_storage_key_string(ship_id, hold_id) <> "/kind",
    )
  })
}

// pub fn ships_to_storage_strings(
//   ship_entries: Dict(Int, mvu.ShipEntry),
// ) -> List(#(String, String)) {
//   list.map(ship_entries |> dict.to_list, ship_to_storage_strings)
//   |> list.flatten
// }

// pub fn ship_to_storage_strings(
//   ship: #(Int, mvu.ShipEntry),
// ) -> List(#(String, String)) {
//   let #(ship_id, ship_entry) = ship
//   let base_string = get_ship_id_storage_key_string(ship_id)
//   // base_string = "ships/1"
//   let name_storage = #(base_string <> "/name", ship_entry.ship.name)
//   // name_string = #("/ships/1/name", "Deluge")
//   let holds_storages =
//     list.map(ship_entry.ship.holds |> dict.to_list, hold_to_storage_strings(
//       _,
//       ship_id,
//     ))
//     |> list.flatten
//   [name_storage, ..holds_storages]
// }

// pub fn hold_to_storage_strings(
//   hold_entry: #(Int, sde.Hold),
//   ship_id: Int,
// ) -> List(#(String, String)) {
//   let #(hold_id, hold) = hold_entry
//   let base_string = get_hold_id_storage_key_string(ship_id, hold_id)
//   // base_string = "ships/1/holds/1"
//   let hold_name_storage = #(base_string <> "/name", hold.name)
//   let hold_capacity_storage = #(
//     base_string <> "/capacity",
//     hold.capacity |> float.to_string,
//   )
//   let hold_kind_storage = #(
//     base_string <> "/kind",
//     hold.kind |> sde.hold_kind_to_string,
//   )
//   [hold_name_storage, hold_capacity_storage, hold_kind_storage]
// }

fn get_ship_id_storage_key_string(ship_id: Int) -> String {
  "ships/" <> int.to_string(ship_id)
}

fn get_hold_id_storage_key_string(ship_id: Int, hold_id: Int) -> String {
  get_ship_id_storage_key_string(ship_id)
  <> "/holds/"
  <> hold_id |> int.to_string
}

fn store_write_to_effect(
  storage: storage.Storage,
  storage_key: String,
  value: String,
) -> effect.Effect(mvu.Msg) {
  effect.from(fn(dispatch) {
    case storage.set_item(storage, storage_key, value) {
      Error(_) -> dispatch(mvu.StoreWriteFailed(storage_key, value))
      Ok(_) -> Nil
    }
  })
}

fn store_read_to_effect(
  storage: storage.Storage,
  storage_key: String,
  parser: fn(String) -> Result(a, Nil),
  msg: fn(a) -> mvu.Msg,
) -> effect.Effect(mvu.Msg) {
  effect.from(fn(dispatch) {
    case
      {
        use value <- result.try(storage.get_item(storage, storage_key))
        parser(value)
      }
    {
      Error(_) -> dispatch(mvu.InitStoreReadFailed(storage_key))
      Ok(value) -> dispatch(msg(value))
    }
  })
}
