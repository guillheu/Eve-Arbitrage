import gleam/dict.{type Dict}
import gleam/option.{type Option}
import lustre/attribute.{attribute}
import lustre/element
import lustre/element/html
import lustre/element/svg
import lustre/event
import mvu

pub fn get_section(model: mvu.Model) -> element.Element(mvu.Msg) {
  let from_list = get_from_list(model.systems, model.source)
  let to_list = get_to_list(model.systems, model.destination)

  html.section([attribute.class("mb-10")], [
    html.h2([attribute.class("text-2xl font-bold mb-4")], [html.text("Systems")]),
    html.div([attribute.class("flex flex-col md:flex-row gap-6")], [
      from_list,
      to_list,
    ]),
  ])
}

fn get_from_list(
  systems: Dict(String, mvu.System),
  selected: Option(String),
) -> element.Element(mvu.Msg) {
  let systems_entries = get_source_systems(systems, selected)

  html.div([attribute.class("w-full md:w-1/2 bg-white rounded-lg shadow-md")], [
    html.h3([attribute.class("p-4 font-semibold border-b")], [html.text("From")]),
    html.ul([attribute.class("h-64 overflow-y-auto")], systems_entries),
  ])
}

fn get_to_list(
  systems: Dict(String, mvu.System),
  selected: Option(String),
) -> element.Element(mvu.Msg) {
  let systems_entries = get_destination_systems(systems, selected)

  html.div([attribute.class("w-full md:w-1/2 bg-white rounded-lg shadow-md")], [
    html.h3([attribute.class("p-4 font-semibold border-b")], [html.text("To")]),
    html.ul([attribute.class("h-64 overflow-y-auto")], systems_entries),
  ])
}

fn get_source_systems(
  systems: Dict(String, mvu.System),
  selected: Option(String),
) -> List(element.Element(mvu.Msg)) {
  {
    use name, system <- dict.map_values(systems)
    case selected, system.sell_orders_status {
      option.Some(selected_system), _ if selected_system == name ->
        get_selected_system
      _, mvu.Empty -> get_empty_system
      _, mvu.Loading -> get_loading_system
      _, mvu.Loaded(_) -> get_loaded_system
    }(name, system, True)
  }
  |> dict.values
}

fn get_destination_systems(
  systems: Dict(String, mvu.System),
  selected: Option(String),
) -> List(element.Element(mvu.Msg)) {
  {
    use name, system <- dict.map_values(systems)
    case selected, system.buy_orders_status {
      option.Some(selected_system), _ if selected_system == name ->
        get_selected_system
      _, mvu.Empty -> get_empty_system
      _, mvu.Loading -> get_loading_system
      _, mvu.Loaded(_) -> get_loaded_system
    }(name, system, False)
  }
  |> dict.values
}

fn get_selected_system(
  name: String,
  system: mvu.System,
  is_source_system: Bool,
) -> element.Element(mvu.Msg) {
  let button = case
    is_source_system,
    system.buy_orders_status,
    system.sell_orders_status
  {
    True, _, mvu.Loading -> get_loading_button()
    True, _, mvu.Loaded(_) -> get_refresh_button(name, is_source_system)
    True, _, mvu.Empty -> todo
    False, _, _ -> todo
  }
  html.li(
    [
      attribute.class(
        "p-4 border-b hover:bg-gray-50 bg-indigo-50 border-l-4 border-l-selected",
      ),
    ],
    [
      html.div([attribute.class("flex justify-between items-center")], [
        html.span([attribute.class("text-selected font-medium")], [
          html.text(system.location.name),
        ]),
        button,
      ]),
    ],
  )
}

fn get_loading_system(
  _name: String,
  system: mvu.System,
  _is_source_system: Bool,
) -> element.Element(mvu.Msg) {
  html.li([attribute.class("p-4 border-b hover:bg-gray-50")], [
    html.div([attribute.class("flex justify-between items-center")], [
      html.span([attribute.class("text-gray-600")], [
        html.text(system.location.name),
      ]),
      get_loading_button(),
    ]),
  ])
}

fn get_empty_system(
  name: String,
  system: mvu.System,
  is_source_system: Bool,
) -> element.Element(mvu.Msg) {
  html.li([attribute.class("p-4 border-b hover:bg-gray-50")], [
    html.div([attribute.class("flex justify-between items-center")], [
      html.span([attribute.class("text-gray-400")], [
        html.text(system.location.name),
      ]),
      get_download_button(name, is_source_system),
    ]),
  ])
}

fn get_loaded_system(
  name: String,
  system: mvu.System,
  is_source_system: Bool,
) -> element.Element(mvu.Msg) {
  let msg = case is_source_system {
    False -> mvu.UserSelectedDestination
    True -> mvu.UserSelectedSource
  }
  html.li(
    [
      attribute.class("p-4 border-b hover:bg-gray-50 cursor-pointer"),
      event.on_click(msg(name)),
    ],
    [
      html.div([attribute.class("flex justify-between items-center")], [
        html.a([attribute.class("block text-gray-800"), attribute.href("#")], [
          html.text(system.location.name),
        ]),
        get_refresh_button(name, is_source_system),
      ]),
    ],
  )
}

fn get_refresh_button(
  name: String,
  is_source_system: Bool,
) -> element.Element(mvu.Msg) {
  let msg = case is_source_system {
    False -> mvu.UserLoadedDestination
    True -> mvu.UserLoadedSource
  }
  html.button(
    [
      attribute("title", "Reload item"),
      attribute.class("p-1 hover:bg-gray-200 rounded"),
      event.on_click(msg(name)),
    ],
    [
      svg.svg(
        [
          attribute("stroke", "currentColor"),
          attribute("viewBox", "0 0 24 24"),
          attribute("fill", "none"),
          attribute.class("h-5 w-5 text-gray-500"),
          attribute("xmlns", "http://www.w3.org/2000/svg"),
        ],
        [
          svg.path([
            attribute(
              "d",
              "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
            ),
            attribute("stroke-width", "2"),
            attribute("stroke-linejoin", "round"),
            attribute("stroke-linecap", "round"),
          ]),
        ],
      ),
    ],
  )
}

fn get_download_button(
  name: String,
  is_source_system: Bool,
) -> element.Element(mvu.Msg) {
  let msg = case is_source_system {
    False -> mvu.UserLoadedDestination
    True -> mvu.UserLoadedSource
  }

  html.button(
    [
      attribute("title", "Download data"),
      attribute.class("p-1 hover:bg-gray-200 rounded"),
      event.on_click(msg(name)),
    ],
    [
      svg.svg(
        [
          attribute("stroke", "currentColor"),
          attribute("viewBox", "0 0 24 24"),
          attribute("fill", "none"),
          attribute.class("h-5 w-5 text-gray-500"),
          attribute("xmlns", "http://www.w3.org/2000/svg"),
        ],
        [
          svg.path([
            attribute(
              "d",
              "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4",
            ),
            attribute("stroke-width", "2"),
            attribute("stroke-linejoin", "round"),
            attribute("stroke-linecap", "round"),
          ]),
        ],
      ),
    ],
  )
}

fn get_loading_button() -> element.Element(mvu.Msg) {
  html.div(
    [
      attribute.class(
        "animate-spin h-5 w-5 border-2 border-gray-500 border-t-transparent rounded-full",
      ),
    ],
    [],
  )
}
