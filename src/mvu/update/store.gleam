import config/sde
import gleam/dict.{type Dict}
import gleam/io
import gleam/list
import gleam/option.{type Option, Some}
import lustre/effect
import mvu
import mvu/update/side_effects/config_to_storage
import util/alert
import util/storage

pub fn init_load_storage(
  model: mvu.Model,
  storage: storage.Storage,
) -> #(mvu.Model, effect.Effect(mvu.Msg)) {
  let model = mvu.Model(..model, storage: Some(storage))
  let effect =
    effect.batch([
      config_to_storage.read_collateral(storage),
      config_to_storage.read_accounting_level(storage),
      config_to_storage.read_hold_indices(storage),
      config_to_storage.read_selected_ship(storage),
    ])
  #(model, effect)
}

pub fn store_load_failed(
  model: mvu.Model,
) -> #(mvu.Model, effect.Effect(mvu.Msg)) {
  alert.alert("Failed to load local storage\nCheck console log for more info")
  #(model, effect.none())
}

pub fn store_write_failed(
  model: mvu.Model,
  storage_key: String,
  value: String,
) -> #(mvu.Model, effect.Effect(mvu.Msg)) {
  alert.alert(
    "Failed to write storage key \""
    <> storage_key
    <> "\" with value \""
    <> value
    <> "\"\nCheck console log for more info",
  )
  #(model, effect.none())
}

pub fn store_read_failed(
  model: mvu.Model,
  storage_key: String,
) -> #(mvu.Model, effect.Effect(mvu.Msg)) {
  io.println_error("Failed to read storage key \"" <> storage_key <> "\"")
  #(model, effect.none())
}

pub fn store_read_ship_name(
  model: mvu.Model,
  name: String,
  id: Int,
) -> #(mvu.Model, effect.Effect(mvu.Msg)) {
  let model = {
    let assert Ok(ship_entry) = dict.get(model.ships, id)
    let ship = ship_entry.ship
    let ship = sde.Ship(..ship, name: name)
    let ship_entry = mvu.ShipEntry(..ship_entry, ship: ship)
    mvu.Model(..model, ships: dict.insert(model.ships, id, ship_entry))
  }
  #(model, effect.none())
}

pub fn store_read_accounting_level(
  model: mvu.Model,
  accounting_level: Int,
) -> #(mvu.Model, effect.Effect(mvu.Msg)) {
  let model = mvu.Model(..model, accounting_level: accounting_level)
  #(model, effect.none())
}

pub fn store_read_collateral(
  model: mvu.Model,
  collateral: Option(Int),
) -> #(mvu.Model, effect.Effect(mvu.Msg)) {
  let model = mvu.Model(..model, collateral: collateral)
  #(model, effect.none())
}

pub fn store_read_hold_capacity(
  model: mvu.Model,
  capacity: Float,
  ship_id: Int,
  hold_id: Int,
) -> #(mvu.Model, effect.Effect(mvu.Msg)) {
  let assert Ok(ship_entry) = dict.get(model.ships, ship_id)
  let ship = ship_entry.ship
  let assert Ok(hold) = dict.get(ship.holds, hold_id)
  let hold = sde.Hold(..hold, capacity: capacity)
  let holds = dict.insert(ship.holds, hold_id, hold)
  let new_ship = sde.Ship(..ship, holds: holds)
  let ship_entry = mvu.ShipEntry(..ship_entry, ship: new_ship)
  let ship_entries = dict.insert(model.ships, ship_id, ship_entry)
  let model = mvu.Model(..model, ships: ship_entries)
  #(model, effect.none())
}

pub fn store_read_hold_indices(
  model: mvu.Model,
  hold_indices: Dict(Int, List(Int)),
) -> #(mvu.Model, effect.Effect(mvu.Msg)) {
  case model.storage {
    Some(storage) -> {
      let ship_entries = {
        use _, hold_ids <- dict.map_values(hold_indices)
        let holds =
          list.map(hold_ids, fn(hold_id) {
            #(
              hold_id,
              sde.Hold(name: "New Hold", capacity: 100.0, kind: sde.Generic),
            )
          })
          |> dict.from_list
        let ship = sde.Ship(name: "New Ship", holds: holds)
        mvu.ShipEntry(ship: ship, is_expanded: False)
      }
      let model = mvu.Model(..model, ships: ship_entries)
      let effect =
        {
          use ship_id, hold_ids <- dict.map_values(hold_indices)
          let ship_read_effects = [
            config_to_storage.read_ship_name(storage, ship_id),
          ]
          use effects, hold_id <- list.fold(hold_ids, ship_read_effects)
          [
            config_to_storage.read_ship_hold_name(storage, ship_id, hold_id),
            config_to_storage.read_ship_hold_capacity(storage, ship_id, hold_id),
            config_to_storage.read_ship_hold_kind(storage, ship_id, hold_id),
            ..effects
          ]
        }
        |> dict.values
        |> list.flatten
        |> effect.batch

      #(model, effect)
    }
    option.None -> #(model, effect.none())
  }
}

pub fn store_read_hold_kind(
  model: mvu.Model,
  hold_kind: sde.HoldKind,
  ship_id: Int,
  hold_id: Int,
) -> #(mvu.Model, effect.Effect(mvu.Msg)) {
  let assert Ok(ship_entry) = dict.get(model.ships, ship_id)
  let ship = ship_entry.ship
  let assert Ok(hold) = dict.get(ship.holds, hold_id)
  let hold = sde.Hold(..hold, kind: hold_kind)
  let holds = dict.insert(ship.holds, hold_id, hold)
  let ship = sde.Ship(..ship, holds: holds)
  let ship_entry = mvu.ShipEntry(..ship_entry, ship: ship)
  let ship_entries = dict.insert(model.ships, ship_id, ship_entry)
  let model = mvu.Model(..model, ships: ship_entries)
  #(model, effect.none())
}

pub fn store_read_hold_name(
  model: mvu.Model,
  hold_name: String,
  ship_id: Int,
  hold_id: Int,
) -> #(mvu.Model, effect.Effect(mvu.Msg)) {
  let assert Ok(ship_entry) = dict.get(model.ships, ship_id)
  let ship = ship_entry.ship
  let assert Ok(hold) = dict.get(ship.holds, hold_id)
  let hold = sde.Hold(..hold, name: hold_name)
  let holds = dict.insert(ship.holds, hold_id, hold)
  let new_ship = sde.Ship(..ship, holds: holds)
  let ship_entry = mvu.ShipEntry(..ship_entry, ship: new_ship)
  let ship_entries = dict.insert(model.ships, ship_id, ship_entry)
  let model = mvu.Model(..model, ships: ship_entries)
  #(model, effect.none())
}

pub fn store_read_selected_ship(
  model: mvu.Model,
  ship_id: Option(Int),
) -> #(mvu.Model, effect.Effect(mvu.Msg)) {
  let model = mvu.Model(..model, current_ship: ship_id)
  #(model, effect.none())
}
