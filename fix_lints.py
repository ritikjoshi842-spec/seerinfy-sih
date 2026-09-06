import re
import os

# PatientSessionContext.jsx
with open('src/context/PatientSessionContext.jsx', 'r', encoding='utf-8') as f:
    c = f.read()
c = c.replace('export function useSession() {', '/* eslint-disable-next-line react-refresh/only-export-components */\nexport function useSession() {')
with open('src/context/PatientSessionContext.jsx', 'w', encoding='utf-8') as f:
    f.write(c)

# Navbar.jsx
with open('src/components/common/Navbar.jsx', 'r', encoding='utf-8') as f:
    c = f.read()
c = re.sub(r'useEffect,\s*', '', c)
c = re.sub(r'import\s*\{\s*FontScaleToggle\s*\}\s*from\s*\'\.\./ui/font-scale\';\s*', '', c)
c = re.sub(r'import\s*\{\s*Button\s*\}\s*from\s*\'\./Button\';\s*', '', c)
with open('src/components/common/Navbar.jsx', 'w', encoding='utf-8') as f:
    f.write(c)

# LandingPage.jsx
with open('src/pages/LandingPage.jsx', 'r', encoding='utf-8') as f:
    c = f.read()
c = re.sub(r'ChevronRight,\s*', '', c)
c = re.sub(r',\s*Star', '', c)
c = re.sub(r'\(_, i\)', '(_, _i)', c)
with open('src/pages/LandingPage.jsx', 'w', encoding='utf-8') as f:
    f.write(c)

# ProgressDashboard.jsx
with open('src/pages/ProgressDashboard.jsx', 'r', encoding='utf-8') as f:
    c = f.read()
c = re.sub(r'\(_, i\)', '(_, _i)', c)
with open('src/pages/ProgressDashboard.jsx', 'w', encoding='utf-8') as f:
    f.write(c)

# TherapySessionPage.jsx
with open('src/pages/TherapySessionPage.jsx', 'r', encoding='utf-8') as f:
    c = f.read()
c = re.sub(r',\s*Leaf', '', c)
c = re.sub(r'\[session\.track, session\.currentImage\]', '[session.track, session.currentImage, session.imageIndex, updateSession, session.profile, session.backendSessionId]', c)
with open('src/pages/TherapySessionPage.jsx', 'w', encoding='utf-8') as f:
    f.write(c)
