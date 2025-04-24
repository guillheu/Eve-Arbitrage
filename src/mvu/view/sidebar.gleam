import lustre/attribute.{attribute}
import lustre/element
import lustre/element/html
import lustre/element/svg
import lustre/event
import mvu
import mvu/view/sidebar/collateral

pub fn get_section(model: mvu.Model) -> element.Element(mvu.Msg) {
  case model.sidebar_expanded {
    False -> get_collapsed_sidebar
    True -> get_expanded_sidebar
  }(model)
}

fn get_expanded_sidebar(model: mvu.Model) -> element.Element(mvu.Msg) {
  html.aside(
    [
      attribute.class(
        "w-80 bg-white shadow-lg h-screen overflow-y-auto flex-shrink-0 border-r border-gray-200",
      ),
    ],
    [
      html.div(
        [
          attribute.class(
            "p-4 border-b border-gray-200 flex justify-between items-center",
          ),
        ],
        [
          html.h2([attribute.class("text-lg font-bold")], [
            html.text("Configuration"),
          ]),
          html.button(
            [
              attribute("title", "Toggle Sidebar"),
              attribute.class("p-1 rounded-md hover:bg-gray-100"),
              event.on_click(mvu.UserClickedCollapseSidebar),
            ],
            [
              svg.svg(
                [
                  attribute("stroke", "currentColor"),
                  attribute("viewBox", "0 0 24 24"),
                  attribute("fill", "none"),
                  attribute.class("h-6 w-6"),
                  attribute("xmlns", "http://www.w3.org/2000/svg"),
                ],
                [
                  svg.path([
                    attribute("d", "M11 19l-7-7 7-7m8 14l-7-7 7-7"),
                    attribute("stroke-width", "2"),
                    attribute("stroke-linejoin", "round"),
                    attribute("stroke-linecap", "round"),
                  ]),
                ],
              ),
            ],
          ),
        ],
      ),
      collateral.get_section(model.collateral),
    ],
  )
}

fn get_collapsed_sidebar(_model: mvu.Model) -> element.Element(mvu.Msg) {
  html.aside(
    [
      attribute.class(
        "w-12 bg-white shadow-lg h-screen flex-shrink-0 border-r border-gray-200 flex flex-col items-center",
      ),
    ],
    [
      html.div(
        [
          attribute.class(
            "p-3 border-b border-gray-200 w-full flex justify-center",
          ),
        ],
        [
          html.button(
            [
              attribute("title", "Expand Sidebar"),
              attribute.class("p-1 rounded-md hover:bg-gray-100 tooltip"),
              attribute.id("toggle-sidebar"),
              event.on_click(mvu.UserClickedExpandSidebar),
            ],
            [
              svg.svg(
                [
                  attribute("stroke", "currentColor"),
                  attribute("viewBox", "0 0 24 24"),
                  attribute("fill", "none"),
                  attribute.class("h-6 w-6 text-gray-600"),
                  attribute("xmlns", "http://www.w3.org/2000/svg"),
                ],
                [
                  svg.path([
                    attribute("d", "M13 5l7 7-7 7M5 5l7 7-7 7"),
                    attribute("stroke-width", "2"),
                    attribute("stroke-linejoin", "round"),
                    attribute("stroke-linecap", "round"),
                  ]),
                ],
              ),
            ],
          ),
        ],
      ),
    ],
  )
}
