import config/esi
import config/sde
import gleam/dict
import gleam/list
import gleam/option.{type Option, None, Some}
import gleam/time/timestamp
import lustre
import lustre/effect
import mvu
import mvu/update
import mvu/view

const default_language = "en"

const default_accounting_level = 0

pub fn main() {
  let app = lustre.application(init, update.run, view.run)
  let assert Ok(_) = lustre.start(app, "#app", Nil)

  Nil
}

fn init(_args) -> #(mvu.Model, effect.Effect(mvu.Msg)) {
  let systems = {
    use systems, #(name, location) <- list.fold(sde.locations, dict.new())
    let system = mvu.System(location, [], mvu.Empty, [], mvu.Empty)
    dict.insert(systems, name, system)
  }
  #(
    mvu.Model(
      ships: dict.new(),
      current_ship: None,
      systems: systems,
      source: None,
      destination: None,
      accounting_level: default_accounting_level,
      language: default_language,
      sidebar_expanded: False,
      collateral: None,
    ),
    effect.none(),
  )
}
