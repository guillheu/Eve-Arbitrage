import lustre/effect
import mvu
import mvu/update/multibuys
import mvu/update/ships
import mvu/update/sidebar
import mvu/update/systems

pub fn run(
  model: mvu.Model,
  msg: mvu.Msg,
) -> #(mvu.Model, effect.Effect(mvu.Msg)) {
  case msg {
    mvu.UserSelectedDestination(new_destination) ->
      systems.user_selected_destination(new_destination, model)
    mvu.UserSelectedSource(new_source) ->
      systems.user_selected_source(new_source, model)
    mvu.UserSelectedShip(selected_ship) ->
      ships.user_selected_ship(selected_ship, model)
    mvu.EsiReturnedBuyOrders(esi_response, location, page) ->
      systems.esi_returned_buy_orders(model, esi_response, location, page)
    mvu.EsiReturnedSellOrders(esi_response, location, page) ->
      systems.esi_returned_sell_orders(model, esi_response, location, page)
    mvu.UserLoadedDestination(destination) ->
      systems.user_loaded_destination(model, destination)
    mvu.UserLoadedSource(source) -> systems.user_loaded_source(model, source)
    mvu.UserClickedCopyMultibuy(multibuy) ->
      multibuys.user_clicked_copy_multibuy(model, multibuy)
    mvu.UserClickedCollapseSidebar ->
      sidebar.user_clicked_collapse_sidebar(model)
    mvu.UserClickedExpandSidebar -> sidebar.user_clicked_expand_sidebar(model)
    mvu.UserUpdatedCollateral(value) ->
      sidebar.user_updated_collateral(model, value)
    mvu.UserUpdatedAccountingLevel(level) ->
      sidebar.user_updated_accounting_level(model, level)
    mvu.UserCreatedShip -> ships.user_created_ship(model)
    mvu.UserDeletedShip(deleted_ship) ->
      ships.user_deleted_ship(model, deleted_ship)
    mvu.UserUpdatedShipName(id) -> ships.user_updated_ship_name(model, id)
  }
}
