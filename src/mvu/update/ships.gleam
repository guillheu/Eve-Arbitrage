import config/sde
import gleam/dict
import gleam/int
import gleam/io
import gleam/option.{Some}
import lustre/effect
import mvu
import util/alert

const default_ship_entry = mvu.ShipEntry(
  sde.Ship(
    name: "New Ship",
    holds: [sde.Hold(name: "Cargo", kind: sde.Generic, m3: 1000.0)],
  ),
  is_expanded: True,
)

pub fn user_selected_ship(
  selected_ship: Int,
  model: mvu.Model,
) -> #(mvu.Model, effect.Effect(mvu.Msg)) {
  let model = mvu.Model(..model, current_ship: Some(selected_ship))
  let side_effect = effect.none()
  io.println("Ship #" <> selected_ship |> int.to_string <> " selected")
  #(model, side_effect)
}

pub fn user_created_ship(
  model: mvu.Model,
) -> #(mvu.Model, effect.Effect(mvu.Msg)) {
  echo "creating ship"
  echo default_ship_entry
  let ships =
    dict.insert(model.ships, model.count_ship_index, default_ship_entry)
  let model =
    mvu.Model(
      ..model,
      ships: ships,
      count_ship_index: model.count_ship_index + 1,
    )
  #(model, effect.none())
}

pub fn user_deleted_ship(
  model: mvu.Model,
  deleted_ship: Int,
) -> #(mvu.Model, effect.Effect(mvu.Msg)) {
  todo
}
