import re
import os

def fix_file(path, func):
    with open(path, 'r', encoding='utf-8') as f:
        c = f.read()
    c2 = func(c)
    if c != c2:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(c2)

def fix_onboarding(c):
    return re.sub(r'function Brain\(props\).*?\}', '', c, flags=re.DOTALL)

def fix_navbar(c):
    c = re.sub(r'import\s*React,\s*\{\s*useEffect,\s*useState\s*\}\s*from\s*\'react\';', 'import React, { useState } from \'react\';', c)
    c = re.sub(r'import\s*\{\s*FontScaleToggle\s*\}\s*from\s*\'\.\./ui/font-scale\';\n?', '', c)
    return c

def fix_landing(c):
    return re.sub(r'\(\_, i\)', '(_, _i)', c)

def fix_progress(c):
    return re.sub(r'\(\_, i\)', '(_, _i)', c)

def fix_therapy(c):
    return re.sub(r'\[session\.track,\s*session\.currentImage\]', '[session.track, session.currentImage, session.imageIndex, updateSession, session.profile, session.backendSessionId]', c)

fix_file('src/pages/OnboardingPage.jsx', fix_onboarding)
fix_file('src/components/common/Navbar.jsx', fix_navbar)
fix_file('src/pages/LandingPage.jsx', fix_landing)
fix_file('src/pages/ProgressDashboard.jsx', fix_progress)
fix_file('src/pages/TherapySessionPage.jsx', fix_therapy)
