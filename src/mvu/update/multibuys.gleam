import arbitrage
import gleam/io
import lustre/effect
import mvu
import mvu/update/side_effects/clipboard

pub fn user_clicked_copy_multibuy(
  model: mvu.Model,
  multibuy: arbitrage.Multibuy,
) -> #(mvu.Model, effect.Effect(mvu.Msg)) {
  let multibuy_text = arbitrage.multibuy_to_string(multibuy)
  let side_effect = clipboard.write(multibuy_text)
  io.println("Multibuy copied to clipboard")
  #(model, side_effect)
}
