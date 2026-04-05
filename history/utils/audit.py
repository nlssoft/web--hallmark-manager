# utils/audit.py

def calculate_changes(before, after):
    changes = []

    all_keys = set(before.keys()) | set(after.keys())

    for key in all_keys:
        old = before.get(key)
        new = after.get(key)

        if old != new:
            changes.append({
                "field": key,
                "before": old,
                "after": new
            })

    return changes