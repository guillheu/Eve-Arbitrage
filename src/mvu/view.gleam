import lustre/attribute
import lustre/element
import lustre/element/html
import mvu
import mvu/view/multibuys
import mvu/view/sidebar
import mvu/view/systems_lists

pub fn run(model: mvu.Model) -> element.Element(mvu.Msg) {
  let sidebar = sidebar.get_section(model)
  let systems_lists = systems_lists.get_section(model)
  let multibuys = multibuys.get_section(model)
  let page_contents = [systems_lists, multibuys]
  let page =
    html.div([attribute.class("flex-1 overflow-auto")], [
      html.div([attribute.class("max-w-6xl mx-auto p-8")], page_contents),
    ])
  html.div([attribute.class("min-h-screen flex")], [sidebar, page])
}
