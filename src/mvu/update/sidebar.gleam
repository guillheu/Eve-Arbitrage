import gleam/option.{Some}
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
  value: Float,
) -> #(mvu.Model, effect.Effect(mvu.Msg)) {
  let model = mvu.Model(..model, collateral: echo Some(value))
  #(model, effect.none())
}
