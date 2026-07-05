# clientnew.wasm static analysis

9,386,389 bytes, WebAssembly MVP. this is the modern florr.io client. the
identity is unambiguous from embedded `florr.io` / `support.florr.io` strings,
the florr discord invite, and the qq group.

the symbol/name section is stripped and imports/exports are minified, so there's
no clean named decompile. the 4.2 MB data section still leaks the whole content
model and every embedded asset.

## module structure

| section   | count | notes |
| --------- | ----- | ----- |
| types     | 182   | function signatures |
| imports   | 361   | all under module `a` (minified wasm-bindgen js interop) |
| functions | 6265  | |
| table     | 1     | funcref (indirect calls / vtables) |
| memory    | 1     | initial = max = 4096 pages = 256 MB (fixed heap) |
| globals   | 1     | stack pointer |
| exports   | 46    | wasm-bindgen entry points (minified: `Nf`,`Of`,… + `Mf`=memory) |
| elem      | 1     | function table init |
| code      | 6265  | 4.66 MB |
| data      | 3171  | 4.16 MB (strings + svg + gzip blobs) |

## content inventory (from the embedded i18n table)

i18n namespaces by entry count: Petals 2903, UI 2148, Achievements 1896,
Chat 1750, Mobs 1581, Talents 1475, Rarities 600, plus Maps/tiles, Flower,
Tutorial, Colors, Drops, Attribute. keys look like
`Petals/<id>/Name|FullName|Description`, localized across english, portuguese,
spanish, french, romanian and more (chinese pinyin `Py`, gender/sortname metadata
present). full id lists and decoded values are in `content/`.

**rarities (10):** common, unusual, rare, epic, legendary, mythic, ultra, super,
unique, eternal.

**petal stats schema:** Damage, Health, Reload, Rarity (per petal, per rarity).

**petals (122 ids).** full list in `content/petals.ids.txt`. main set:
air amulet ankh ant_egg antennae bandage basic basil battery bean beetle_egg
blood_stinger blueberries bone broccoli bubble bulb bur cactus card carrot
champion_crown chip claw clay clover cog coin compass coral corn corruption
cotton crown cutter dahlia dandelion dead_leaf dice disc domino dust electric_web
fang faster glass goggles golden_leaf grapes heavy honey iris jelly laser leaf
lentil light lightning lotus magic_bubble magic_cactus magic_cotton magic_eye
magic_leaf magic_missile magic_stick magic_stinger magnet mark mecha_antennae
mecha_missile mimic missile mjolnir monstera moon nazar none orange orb pearl
peas pharaoh_crown pincer plank pollen poo powder privet relic rice rock root
rose rubber sacrifice salt sand sawblade shell shovel soil splitter sponge square
starfish stick stinger talisman third_eye tomato totem triangle uranium wax web
wing yggdrasil yin_yang yucca

**mobs (87 ids).** full list in `content/mobs.ids.txt`. main set:
ant_baby ant_egg ant_hole ant_queen ant_soldier ant_soldier_diver ant_worker
assembler barrel bee beetle beetle_hel beetle_mummy beetle_nazar beetle_pharaoh
bubble bumble_bee bush cactus centipede centipede_body centipede_desert
centipede_desert_body centipede_evil centipede_evil_body centipede_hel
centipede_hel_body crab crab_mecha crystal dandelion digger dummy fire_ant_baby
fire_ant_burrow fire_ant_egg fire_ant_queen fire_ant_soldier fire_ant_worker
firefly firefly_magic fly gambler garbage ghost hornet jellyfish ladybug
ladybug_dark ladybug_shiny leafbug leafbug_shiny leech leech_body mantis
mecha_flower moth none oracle roach rock sandstorm scorpion shell silverfish
spider spider_hel spider_mecha sponge square starfish termite_baby termite_egg
termite_mound termite_overmind termite_soldier termite_worker titan tomb trader
wasp wasp_hel wasp_mecha worm worm_guts

**talents (113 ids, leveled):** antennae1-3, body_damage1-8, body_toxicity,
concentrated_poison, crafting(+per-rarity), duplicator1-4, health1-9,
inventory6-10, luck1-9, magnetism, medic1-9, petal_health1-9, petal_rotation1-5,
poison1-9, reach1-3, reload1-9, second_chance1-2, summoner1-9.

**maps / biomes (18):** garden, desert, ocean, jungle, sewers, pyramid, hel,
ant_hell, factory, crystal_room, training_grounds, worm, ant_hole1-5.

**achievements (142):** numeric ids, localized names like "The lucky one",
"The unlucky one", "Crafter".

## embedded assets

- 148 svg vector assets (`<svg>`/viewBox ×151, `<path` ×1085, 271 `.svg` refs):
  the petal/mob/ui art. see `svg/`.
- 92 gzip blobs (base64 `H4sI…`) decode to byte grids from 12×12 up to 246×246
  (60,516 B): per-map terrain / tile / collision data. see `maps/`.
- the full in-game changelog is embedded verbatim. see `data/changelog.txt`.

## what can't be recovered from the binary alone

- function names: stripped. a behavioral decompile means reading 6265 wasm-opt'd
  functions by hand, or pairing with the companion js glue (not included here).
- the wire protocol: binary, not in strings. would need live capture plus
  reversing the entity/component serialization.
- js ↔ wasm import mapping: the 361 imports are minified to `a.*`; resolving them
  to concrete web apis needs the companion `.js` glue file.
