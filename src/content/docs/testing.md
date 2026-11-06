Run the unified suite across **Tech A**, **Tech B**, **Tech C**, **Titanic**, **Pompeii**, and **Waterloo** (413 passed, 3 skipped on 6 November 2026; `test_ui_layout.py`, `test_report.py`, `test_simfile.py` and `mind/human_tests` add more):

```powershell
$env:SDL_VIDEODRIVER="dummy"; python -m pytest test_contracts_and_engine.py test_titanic.py test_pompeii.py test_waterloo.py mind/tests stranded_physics/core -q
```
