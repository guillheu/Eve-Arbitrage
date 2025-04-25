import gleam/dict.{type Dict}
import gleam/list
import gleam/string

pub type Id =
  Int

pub type Location {
  Location(
    name: String,
    stations: List(Id),
    system: Id,
    region: Id,
    contraband: List(Id),
  )
}

pub type Ship {
  Ship(name: String, holds: Dict(Int, Hold))
}

pub type Hold {
  Hold(name: String, kind: HoldKind, capacity: Float)
}

pub type HoldKind {
  Generic
  Infrastructure
}

const jita_contraband = [3713, 3721, 17_796]

const amarr_contraband = [12_478, 3727]

const rens_contraband = []

const hek_contraband = []

const dodi_contraband = []

const thera_contraband = []

pub const locations = [
  #(
    "JITA",
    Location("Jita", [60_003_760], 30_000_142, 10_000_002, jita_contraband),
  ),
  #(
    "AMARR",
    Location("Amarr", [60_008_494], 30_002_187, 10_000_043, amarr_contraband),
  ),
  #(
    "RENS",
    Location("Rens", [60_004_588], 30_002_510, 10_000_030, rens_contraband),
  ),
  #(
    "HEK",
    Location("Hek", [60_005_686], 30_002_053, 10_000_042, hek_contraband),
  ),
  #(
    "DODI",
    Location("Dodi", [60_003_760], 30_000_142, 10_000_032, dodi_contraband),
  ),
  #(
    "THERA",
    Location(
      "Thera",
      [60_015_148, 60_015_149, 60_015_150, 60_015_151],
      31_000_005,
      11_000_031,
      thera_contraband,
    ),
  ),
]

const infrastructure_hold_whitelist = [
  2870, 2871, 2872, 2875, 2876, 2393, 2396, 3779, 2401, 2390, 2397, 2392, 3683,
  2389, 2399, 2395, 2398, 9828, 2400, 3645, 2329, 3828, 9836, 9832, 44, 3693,
  15_317, 3725, 3689, 2327, 9842, 2463, 2317, 2321, 3695, 9830, 3697, 9838, 2312,
  3691, 2319, 9840, 3775, 2328, 2358, 2345, 2344, 2367, 17_392, 2348, 9834, 2366,
  2361, 17_898, 2360, 2354, 2352, 9846, 9848, 2351, 2349, 2346, 12_836, 17_136,
  28_974, 81_143, 81_144, 56_201, 56_202, 56_203, 56_204, 56_205, 56_206, 56_207,
  56_208, 81_920, 16_633, 16_634, 16_635, 16_636, 16_637, 16_638, 16_639, 16_640,
  16_641, 16_642, 16_643, 16_644, 16_646, 16_647, 16_648, 16_649, 16_650, 16_651,
  16_652, 16_653, 35_832, 35_833, 35_834, 40_340, 47_512, 47_513, 47_514, 47_515,
  47_516, 35_825, 35_826, 35_827, 81_826, 35_835, 35_836, 82_492, 82_493, 82_494,
  82_495, 82_496, 82_497, 82_498, 82_499, 82_500, 82_579, 82_580, 82_581, 82_582,
  82_583, 82_584, 82_585, 82_586, 82_587, 82_588, 82_589, 82_590, 82_591, 82_592,
  82_609, 81_615, 81_619, 81_621, 81_623, 32_458, 81_080, 33_475, 33_700, 33_702,
  56_701, 81_951, 33_474, 33_520, 33_522, 37_846, 37_847, 37_848, 47_303, 3962,
  16_272, 16_273, 16_274, 16_275, 17_887, 17_888, 17_889, 2129, 2130, 2131, 2132,
  2133, 2134, 2135, 2136, 2137, 2138, 2139, 2140, 2141, 2142, 2143, 2144, 2145,
  2146, 2147, 2148, 2149, 2150, 2151, 2152, 2153, 2154, 2155, 2156, 2157, 2158,
  2159, 2160, 2254, 2524, 2525, 2533, 2534, 2549, 2550, 2551, 2574, 2576, 2577,
  2578, 2581, 2582, 2585, 2586, 47_035, 47_036, 47_138, 47_139, 47_140, 47_141,
  47_142, 47_143, 47_144, 47_145, 47_146, 47_147, 47_148, 47_149, 47_150, 47_151,
]

pub fn is_item_allowed_in_hold(item: Id, hold_kind: HoldKind) -> Bool {
  case hold_kind {
    Generic -> True
    Infrastructure -> list.contains(infrastructure_hold_whitelist, item)
  }
}

pub fn is_item_contraband(item: Id, location: String) -> Bool {
  let assert Ok(found) = list.key_find(locations, location)
  list.contains(found.contraband, item)
}

pub fn hold_kind_to_string(hold_kind: HoldKind) -> String {
  case hold_kind {
    Generic -> "Generic"
    Infrastructure -> "Infrastructure"
  }
}

pub fn get_all_hold_kinds() -> List(HoldKind) {
  [Generic, Infrastructure]
}

pub fn hold_kind_from_string(hold_kind_string: String) -> Result(HoldKind, Nil) {
  case hold_kind_string |> string.lowercase |> string.trim {
    "generic" -> Ok(Generic)
    "infrastructure" -> Ok(Infrastructure)
    _ -> Error(Nil)
  }
}
