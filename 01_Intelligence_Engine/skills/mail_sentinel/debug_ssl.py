import socket
import ssl
import sys

def debug_ssl_connection(host, port):
    print(f"\n--- Debugging SSL Connection to {host}:{port} ---")
    context = ssl.create_default_context()
    try:
        with socket.create_connection((host, port), timeout=10) as sock:
            print(f"TCP Connection established to {host}:{port}")
            with context.wrap_socket(sock, server_hostname=host) as ssock:
                print(f"SSL Handshake successful!")
                print(f"Protocol: {ssock.version()}")
                print(f"Cipher: {ssock.cipher()}")
                peer_cert = ssock.getpeercert()
                print(f"Certificate Subject: {peer_cert.get('subject')}")
    except Exception as e:
        print(f"SSL Connection FAILED: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_ssl_connection("imap.feishu.cn", 993)
    debug_ssl_connection("smtp.feishu.cn", 465)
