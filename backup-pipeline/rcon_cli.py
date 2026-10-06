#!/usr/bin/env python3
"""
Lightweight RCON Client for Minecraft Server Automation.
Zero dependencies (uses standard python3 socket and struct).
"""
import sys
import socket
import struct

def run_rcon(host: str, port: int, password: str, command: str, timeout: float = 4.0):
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(timeout)
        s.connect((host, int(port)))

        # Packet type 3 = SERVERDATA_AUTH
        auth_data = password.encode("utf-8")
        packet = struct.pack("<iii", 4 + 4 + len(auth_data) + 2, 1, 3) + auth_data + b"\x00\x00"
        s.sendall(packet)
        res = s.recv(1024)

        if len(res) < 12:
            print("ERR: Invalid auth packet received", file=sys.stderr)
            s.close()
            return False, "Auth packet error"

        size, req_id, p_type = struct.unpack("<iii", res[:12])
        if req_id == -1:
            print("ERR: RCON authentication failed (bad password)", file=sys.stderr)
            s.close()
            return False, "Bad RCON password"

        # Packet type 2 = SERVERDATA_EXECCOMMAND
        cmd_data = command.encode("utf-8")
        packet = struct.pack("<iii", 4 + 4 + len(cmd_data) + 2, 2, 2) + cmd_data + b"\x00\x00"
        s.sendall(packet)
        res = s.recv(4096)
        s.close()

        output = ""
        if len(res) >= 12:
            output = res[12:-2].decode("utf-8", errors="replace").strip()
        return True, output

    except ConnectionRefusedError:
        return False, "Server is offline (connection refused)"
    except socket.timeout:
        return False, "Connection timed out"
    except Exception as e:
        return False, str(e)

if __name__ == "__main__":
    if len(sys.argv) < 5:
        print(f"Usage: {sys.argv[0]} <host> <port> <password> <command>", file=sys.stderr)
        sys.exit(2)

    host = sys.argv[1]
    port = int(sys.argv[2])
    password = sys.argv[3]
    command = " ".join(sys.argv[4:])

    success, message = run_rcon(host, port, password, command)
    if success:
        if message:
            print(message)
        sys.exit(0)
    else:
        print(f"[RCON FAILED] {message}", file=sys.stderr)
        sys.exit(1)
