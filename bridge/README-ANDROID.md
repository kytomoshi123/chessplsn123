# Нативный Stockfish на Android (Termux)

Сильнее и быстрее, чем WASM в браузере: настоящий бинарник Stockfish на всех ядрах телефона.

1. Установи Termux (из F-Droid) и в нём: `pkg install nodejs`
2. Положи папку сайта (chessplan) и бинарник `stockfish-android-arm64-universal` в домашнюю папку Termux (не на карту памяти: оттуда Android не даёт запускать файлы).
3. Выдай права: `chmod +x stockfish-android-arm64-universal`
4. Запусти мост: `cd chessplan/bridge && node bridge.js ../../stockfish-android-arm64-universal`
5. Открой в браузере телефона `http://localhost:8765`. В карточке справа появится «Stockfish (нативный)».

Если мост не запущен, сайт сам работает на Stockfish WASM или встроенном движке.
Мост слушает только этот телефон (127.0.0.1) и пропускает только безопасные команды движка.
