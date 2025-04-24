import arbitrage

pub fn user_clicked_copy_multibuy(multibuy: arbitrage.Multibuy) {
  let multibuy_text = arbitrage.multibuy_to_string(multibuy)
  echo multibuy_text
  todo as "copy multibuy to clipboard..."
}
