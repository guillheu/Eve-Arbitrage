import config/esi
import config/sde
import lustre/effect
import mvu
import rsvp

pub fn get_query_sell_orders_side_effect(
  location: sde.Location,
  from: String,
  page: Int,
) -> effect.Effect(mvu.Msg) {
  let query_handler =
    rsvp.expect_json(esi.sell_orders_decoder(), mvu.EsiReturnedSellOrders(
      _,
      from,
      page,
    ))
  let url = esi.get_market_orders_url(location, False, page)
  rsvp.get(url, query_handler)
}

pub fn get_query_buy_orders_side_effect(
  location: sde.Location,
  from: String,
  page: Int,
) -> effect.Effect(mvu.Msg) {
  let query_handler =
    rsvp.expect_json(esi.buy_orders_decoder(), mvu.EsiReturnedBuyOrders(
      _,
      from,
      page,
    ))
  let url = esi.get_market_orders_url(location, True, page)
  rsvp.get(url, query_handler)
}
