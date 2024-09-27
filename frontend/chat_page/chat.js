function togglePanel() {
    const contactPanel = document.getElementById('contactPanel');
    const settingsPanel = document.getElementById('settingsPanel');
    
    if (contactPanel.classList.contains('active')) {
        contactPanel.classList.remove('active');
        settingsPanel.classList.add('active');
    } else {
        settingsPanel.classList.remove('active');
        contactPanel.classList.add('active');
    }
}
