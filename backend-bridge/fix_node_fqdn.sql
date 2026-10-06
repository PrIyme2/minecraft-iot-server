-- ==============================================================================
-- Pterodactyl / Reviactyl Node FQDN Fix for Private Network Access (PNA)
-- ==============================================================================
-- Problem: Chrome/Chromium blocks WebSocket connections (ws://) from a domain name
-- to a raw IP address (e.g. 192.168.0.33:8080), resulting in a red warning bar:
-- "Keine Verbindung zum Server hergestellt" in the server console.
--
-- Solution: Set the node FQDN to the matching domain name so both web and WebSocket
-- share the same origin zone.
-- ==============================================================================

USE panel;

-- 1. Inspect current node configuration
SELECT id, name, fqdn, scheme, daemonListen, daemonSFTP FROM nodes;

-- 2. Update Node FQDN to match the DNS zone
UPDATE nodes 
SET fqdn = 'panel.server.priyme', scheme = 'http', daemonListen = 8080
WHERE id = 1;

-- 3. Verify changes
SELECT id, name, fqdn, scheme, daemonListen, daemonSFTP FROM nodes;
