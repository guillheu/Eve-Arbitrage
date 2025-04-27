import config/sde
import gleam/dict.{type Dict}
import gleam/option.{type Option, Some}
import lustre/effect
import mvu
import mvu/update/side_effects/config_to_storage
import util/alert
import util/storage

pub fn store_loaded_storage(
  model: mvu.Model,
  storage: storage.Storage,
) -> #(mvu.Model, effect.Effect(mvu.Msg)) {
  let model = mvu.Model(..model, storage: Some(storage))
  let effect = effect.batch([config_to_storage.read_collateral(storage)])
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
  alert.alert(
    "Failed to read storage key \""
    <> storage_key
    <> "\"\nCheck console log for more info",
  )
  #(model, effect.none())
}

pub fn store_read_ship_name(
  model: mvu.Model,
  name: String,
  id: Int,
) -> #(mvu.Model, effect.Effect(mvu.Msg)) {
  todo
}

pub fn store_read_accounting_level(
  model: mvu.Model,
  accounting_level: Int,
) -> #(mvu.Model, effect.Effect(mvu.Msg)) {
  todo
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
  todo
}

pub fn store_read_hold_indices(
  model: mvu.Model,
  hold_indices: Dict(Int, List(Int)),
) -> #(mvu.Model, effect.Effect(mvu.Msg)) {
  todo
}

pub fn store_read_hold_kind(
  model: mvu.Model,
  hold_kind: sde.HoldKind,
  ship_id: Int,
  hold_id: Int,
) -> #(mvu.Model, effect.Effect(mvu.Msg)) {
  todo
}

pub fn store_read_hold_name(
  model: mvu.Model,
  hold_name: String,
  ship_id: Int,
  hold_id: Int,
) -> #(mvu.Model, effect.Effect(mvu.Msg)) {
  todo
}

pub fn store_read_ship_indices(
  model: mvu.Model,
  ship_indices: List(Int),
) -> #(mvu.Model, effect.Effect(mvu.Msg)) {
  todo
}
