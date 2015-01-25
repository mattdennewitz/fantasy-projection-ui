# Fantasy Projections UI

Simple slicing and dicing for non-auction leagues.

## Note

This is a scratch repo for working with static data. This will be rolled into
a Python app that includes importing projections via schematics.

### Schematics

Every projection system has its own component coding and ordering,
and not all projection systems include all components. Most systems
also use 0 to 1 player ids, from any number of existing ID systems.
Before import, each projection is modeled in a schematic
which maps projection-level component codes
(e.g., "HRA" v. "HR" for home runs allowed by a pitcher), as well as
age, roles/positions, and more.

## TODO

- Bundle in schematics-backed projection ingress
- Filter by position
- Add OOB player to filtered position list (e.g., show Brett Lawrie in 2B list)
- Player valuation in rendering
- Indicate players as "keepers" to remove from scoring dataset
