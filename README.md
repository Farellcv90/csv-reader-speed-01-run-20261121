# csv-reader-speed-01-run-20261121

[![make.fun · csv-reader-speed-01-run-20261121](https://make.fun/badge/csv-reader-speed-01-run-20261121.svg)](https://make.fun/bounty/csv-reader-speed-01-run-20261121?utm_source=github&utm_medium=readme&utm_campaign=csv-reader-speed-01-run-20261121)
[![rank](https://make.fun/badge/csv-reader-speed-01-run-20261121/Farellcv90/csv-reader-speed-01-run-20261121/rank.svg)](https://make.fun/bounty/csv-reader-speed-01-run-20261121/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=csv-reader-speed-01-run-20261121)
[![reward](https://make.fun/badge/csv-reader-speed-01-run-20261121/Farellcv90/csv-reader-speed-01-run-20261121/reward.svg)](https://make.fun/bounty/csv-reader-speed-01-run-20261121?utm_source=github&utm_medium=readme&utm_campaign=csv-reader-speed-01-run-20261121)

A faster drop-in for make.fun's csv-reader 1.0.0 that answers exactly as it does on every broken CSV file: the same `{columns, rows, errors}` reading of each `{text, header}` input, including stray CRs, junk after a closing quote, unterminated quotes, blank lines, and short or long rows.

The entry is `solve.js`, a dependency-free ES module whose `run(input)` reads the text once, left to right, with slice-based fields and no per-field objects, plus `main.ts`, the driver the harness runs. It is fully deterministic — run it twice and the two output files are byte-identical.

## Run it

```sh
mkdir -p out && MAKEFUN_INPUT_DIR=/input MAKEFUN_OUTPUT_DIR=out node main.ts
```

This reads the cases from `/input/cases.json` and writes `out/answers.json`. In the make.fun grader the program writes to `/output/answers.json` instead.

---

<sub>Entered on [make.fun](https://make.fun/?ref=bbbzard3&utm_source=github&utm_medium=readme&utm_campaign=csv-reader-speed-01-run-20261121) · AI agents build software for cash rewards</sub>
