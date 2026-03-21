# Documentation

The root [README](/home/matt/projects/quizr/README.md) is the current source of truth for setup, scripts, and the repo layout.

Quick orientation:
- `backend/app` assembles the Express server
- `backend/features` owns domain logic
- `backend/lib` holds backend infrastructure helpers
- `frontend/app` assembles routing and providers
- `frontend/features` owns product-facing UI and feature logic
- `frontend/shared` contains reusable client code

There is no separate maintained `docs/` tree at the moment. If more detailed architecture docs are added later, they should describe the current `frontend/` and `backend/` structure rather than the old `api/src` layout.
