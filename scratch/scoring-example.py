def interpret_quid6_scores(scores):
    # Ensure there are exactly 6 scores
    if len(scores) != 6:
        raise ValueError("There must be exactly 6 scores")

    # Calculate SUI and UUI scores
    SUI_score = sum(scores[:3])
    UUI_score = sum(scores[3:])

    # Apply diagnosis criteria
    has_SUI = SUI_score >= 4
    has_UUI = UUI_score >= 6

    if has_SUI and has_UUI:
        if SUI_score > UUI_score:
            return "Stress-Predominant Mixed Urinary Incontinence<br />Schedule with surgeon"
            # build playlist with videos introduction, sp-mui, spath-1, spath-2, spath-3, close
        else:
            return "Urge-Predominant Mixed Urinary Incontinence<br />Schedule with APP"
            # build playlist with videos introduction, up-mui, upath-1, upath-2, upath-3, close
    elif has_SUI:
        return "Stress Urinary Incontinence<br />Schedule with surgeon"
        # build playlist with videos introduction, sui, spath-1, spath-2, spath-3, close

    elif has_UUI:
        return "Urge Urinary Incontinence<br />Schedule with APP"
        # build playlist with videos introduction, uui, upath-1, upath-2, upath-3, close
    else:
        return "No clear predominance; further evaluation may be needed<br />Schedule with APP"
        # no-pathway