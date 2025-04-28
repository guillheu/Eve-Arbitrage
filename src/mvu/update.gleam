import lustre/effect
import mvu
import mvu/update/multibuys
import mvu/update/ships
import mvu/update/sidebar
import mvu/update/store
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
    mvu.UserClickedComputeMultibuys ->
      multibuys.user_clicked_compute_multibuys(model)
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
    mvu.UserUpdatedShipHoldName(hold_id, ship_id) ->
      ships.user_updated_ship_hold_name(model, hold_id, ship_id)
    mvu.UserUpdatedShipHoldCapacity(hold_id, ship_id) ->
      ships.user_updated_ship_hold_capacity(model, hold_id, ship_id)
    mvu.UserUpdatedShipHoldKind(hold_kind, hold_id, ship_id) ->
      ships.user_updated_ship_hold_kind(model, hold_kind, hold_id, ship_id)
    mvu.UserAddedHoldToShip(ship_id) ->
      ships.user_added_hold_to_ship(model, ship_id)
    mvu.UserDeletedHoldFromShip(hold_id, ship_id) ->
      ships.user_deleted_hold_from_ship(model, hold_id, ship_id)
    mvu.UserCollapsedShip(ship_id) -> ships.user_collapsed_ship(model, ship_id)
    mvu.UserExpandedShip(ship_id) -> ships.user_expanded_ship(model, ship_id)
    mvu.StoreWriteFailed(storage_key, value) ->
      store.store_write_failed(model, storage_key, value)
    mvu.InitStoreReadFailed(storage_key) ->
      store.store_read_failed(model, storage_key)
    mvu.InitStoreReadShipName(name, id) ->
      store.store_read_ship_name(model, name, id)
    mvu.InitStoreReadAccountingLevel(accounting_level) ->
      store.store_read_accounting_level(model, accounting_level)
    mvu.InitStoreReadCollateral(collateral) ->
      store.store_read_collateral(model, collateral)
    mvu.InitStoreReadHoldCapacity(capacity, ship_id, hold_id) ->
      store.store_read_hold_capacity(model, capacity, ship_id, hold_id)
    mvu.InitStoreReadHoldIndices(hold_indices) ->
      store.store_read_hold_indices(model, hold_indices)
    mvu.InitStoreReadHoldKind(kind, ship_id, hold_id) ->
      store.store_read_hold_kind(model, kind, ship_id, hold_id)
    mvu.InitStoreReadHoldName(name, ship_id, hold_id) ->
      store.store_read_hold_name(model, name, ship_id, hold_id)
    mvu.InitLoadStorage(storage) -> store.init_load_storage(model, storage)
    mvu.InitStoreLoadFailed -> store.store_load_failed(model)
    mvu.InitStoreReadSelectedShip(ship_id) ->
      store.store_read_selected_ship(model, ship_id)
  }
}
