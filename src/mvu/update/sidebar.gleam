import gleam/option.{type Option}
import lustre/effect
import mvu

pub fn user_clicked_collapse_sidebar(
  model: mvu.Model,
) -> #(mvu.Model, effect.Effect(mvu.Msg)) {
  let model = mvu.Model(..model, sidebar_expanded: False)
  #(model, effect.none())
}

pub fn user_clicked_expand_sidebar(
  model: mvu.Model,
) -> #(mvu.Model, effect.Effect(mvu.Msg)) {
  let model = mvu.Model(..model, sidebar_expanded: True)
  #(model, effect.none())
}

pub fn user_updated_collateral(
  model: mvu.Model,
  value: Option(Int),
) -> #(mvu.Model, effect.Effect(mvu.Msg)) {
  let model = mvu.Model(..model, collateral: value)
  #(model, effect.none())
}

pub fn user_updated_accounting_level(
  model: mvu.Model,
  level: Int,
) -> #(mvu.Model, effect.Effect(mvu.Msg)) {
  let model = mvu.Model(..model, accounting_level: level)
  #(model, effect.none())
}
