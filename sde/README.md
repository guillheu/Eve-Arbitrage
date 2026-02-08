# SDE

The Eve Arbitrage tool has hard-coded types metadata. This sub-project generates the code snippet that can then be pasted into the source code of the tool for convenience.

This sub-project will format the types from an expected `types.yaml` file into a gleam-compatible `types.txt` file that can be pasted directly into the gleam source of the project.

## How to use
- Download and extract the Eve Online SDE archive from [https://developers.eveonline.com/static-data](https://developers.eveonline.com/static-data)
- Copy the `types.yaml` file inte the `/sde` directory
- `cd sde && gleam run`
- Copy the contents of the generated `types.txt` into your Gleam source code.