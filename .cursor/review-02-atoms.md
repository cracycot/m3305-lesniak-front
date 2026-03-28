# Code review: Task 02 — Слой speech atoms

## Что сделано хорошо

- **Структура данных**: `SpeechAtom` — dataclass с полным набором полей, есть `to_dict()` для сериализации и передачи в задачу 03/04.
- **Нормализация текста**: `normalize_text_norm` — trim, схлопывание пробелов, унификация кавычек и тире (Unicode → ASCII). `normalize_text_search` — lowercase + нормализация поверх norm, схлопывание повторяющихся точек. Соответствует спецификации.
- **atom_id**: Формат `{video_id}_atom_{ordinal}`, 0-based ordinal зафиксирован в `ATOM_ORDINAL_BASE`, детерминированность есть.
- **Связывание**: `prev_atom_id` / `next_atom_id` корректно выставляются для последовательных атомов внутри одного видео; используется мутация предыдущего атома при добавлении следующего.
- **Экспорты**: В `__init__.py` экспортируются `build_atoms`, `build_atom_id`, `normalize_text_norm`, `normalize_text_search`, `SpeechAtom`.
- **Тесты**: Покрыты формат и детерминированность `atom_id`, порядок по start внутри одного источника, все обязательные поля, prev/next, нормализация (trim, пробелы, кавычки, тире, lowercase, точки), интеграция с `load_and_validate_transcripts`.
- **Доп. поля**: `source_id`, `atom_index`, `duration`, `token_estimate`, `is_empty`, `is_low_information`, `char_len_*` — полезны для чанкинга и отладки, не конфликтуют с задачей 03.

---

## Критические замечания (нужно исправить)

### 1. Несколько source_id на один video_id: дубликаты atom_id и нарушение порядка по start

**Проблема.** Сейчас для каждого `(video_id, source_id)` формируется свой блок атомов с ordinal 0, 1, 2, … внутри блока. Список блоков сортируется по `(video_id, source_id)`. В результате:

- Если один и тот же `video_id` приходит от двух разных `source_id` (например, два пути к одному файлу дают один и тот же `canonicalize_video_id`), у двух атомов будут одинаковые `atom_id` (например, `video_abc_atom_0` от первого и второго источника).
- Критерий приёмки 4: «Атомы одного видео идут в порядке возрастания start» — выполняется только внутри каждого источника; глобально по видео порядок может нарушаться (сначала все атомы источника A, потом B), а не по возрастанию start.

**Требование.** Нужно собирать атомы по `video_id`: для каждого видео объединить все сегменты из всех источников с этим видео, отсортировать по `start` (и при равенстве по `end`), затем присвоить ordinal 0, 1, 2, … уже по этой объединённой последовательности и строить атомы. Так будут уникальные `atom_id` и корректный порядок по start.

**Пример исправления логики в `build_atoms`:**

```python
# 1) Собрать по video_id все сегменты с меткой source_id
from collections import defaultdict
video_segments: dict[str, list[tuple[str, dict]]] = defaultdict(list)  # video_id -> [(source_id, seg), ...]
for source_id, data in validated.items():
    segments = data.get("segments") or []
    video_id = data.get("video_id") or source_to_video.get(source_id)
    if not video_id:
        continue
    for seg in segments:
        video_segments[video_id].append((source_id, seg))

atoms = []
for video_id in sorted(video_segments.keys()):
    pairs = video_segments[video_id]
    pairs.sort(key=lambda p: (p[1]["start"], p[1]["end"]))
    last_atom = None
    for ordinal, (source_id, seg) in enumerate(pairs):
        # ... построить atom с этим ordinal и video_id, prev/next от last_atom ...
        last_atom = atom
        atoms.append(atom)
```

Итог: один общий порядок по start на видео и уникальные ordinal/atom_id.

---

## Рекомендации (желательно)

- **Документация формата atom_id**: В задаче указан вид `video_<hash>_atom_<ordinal>`. В коде используется `video_id` (уже «video_<hash>» из задачи 01). Имеет смысл в docstring `build_atom_id` явно написать: «video_id должен быть формата video_<hash> (канонический id из задачи 01)».
- **Тест на несколько source → один video**: Добавить тест, где два разных `source_id` маппятся в один `video_id`, с разным порядком start (например, у источника A сегменты 0–1 и 2–3, у B — 1.5–2.5). Проверить: 1) все atom_id уникальны; 2) порядок атомов по полю start строго возрастающий.

---

## Итог

- Критично: исправить построение атомов при нескольких source_id на один video_id (объединение сегментов по video_id, сортировка по start, единая нумерация ordinal и связывание prev/next).
- После этого реализация будет соответствовать критериям приёмки и задаче 02; тесты и качество кода в порядке, дополнительно стоит добавить тест на «multiple sources → one video».
