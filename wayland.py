# synclipboard client for wayland
# supports text and image(png) clipboard

# Since setting hotkey needs root permission and will cause extra bugs on notification,
# this script will only upload once it is executed, you can manually set hotkey in your
# desktop environment settings.

import sys
import subprocess
# pip install requests
import requests
# pip install plyer dbus-python
from plyer import notification
import base64
from typing import Union, Tuple

# here you can change the hostname and port of synclipboard server
hostname = 'localhost'
port = 3000

def get_clipboard() -> Tuple[str, Union[str, bytes, None]]:
    res = subprocess.run(["wl-paste", "--list-types"], stdout=subprocess.PIPE)
    if 'image/png' in res.stdout.decode():
        content = subprocess.run(["wl-paste", "--type=image/png"], stdout=subprocess.PIPE).stdout
        return 'png', content
    if 'text/plain;charset=utf-8' in res.stdout.decode():
        content = subprocess.run(["wl-paste", "--type=text/plain;charset=utf-8"], stdout=subprocess.PIPE).stdout.decode()
        return 'txt', content
    return 'unsupported', None

def base64_encode(data: Union[str, bytes]) -> str:
    if isinstance(data, str):
        return base64.b64encode(data.encode()).decode()
    return base64.b64encode(data).decode()

def send_data(hostname: str, port: int, encoded_data: str, mime: str) -> None:
    url = f'http://{hostname}:{port}/clipboard-push'
    data = {
        'platform': 'wayland',
        'mime': mime,
        'data': encoded_data
    }
    response = requests.post(url, json=data)
    if response.status_code != 200:
        notification.notify(
            title = 'Synclipboard',
            message = 'Failed to send data to synclipboard server.',
            timeout = 5
        )
    else:
        notification.notify(
            title = 'Synclipboard',
            message = 'Upload clipboard success.',
            timeout = 2
        )

def upload():
    mime, content = get_clipboard()
    if mime == 'unsupported':
        notification.notify(
            title = 'Synclipboard',
            message = 'Unsupported content mime.',
            timeout = 5
        )
    else:
        encoded_data = base64_encode(content)
        send_data(hostname, port, encoded_data, mime)

def download():
    response = requests.post(f'http://{hostname}:{port}/clipboard-pull', json={'platform': 'wayland'})
    if response.status_code != 200:
        notification.notify(
            title = 'Synclipboard',
            message = 'Failed to get data from synclipboard server.',
            timeout = 5
        )
    else:
        data = response.json()
        mime = data['mime']
        if mime == 'txt':
            subprocess.run(["wl-copy", "--type=text/plain;charset=utf-8", data['data']])
        elif mime == 'png':
            content = base64.b64decode(data['data'])
            subprocess.run(["wl-copy", "--type=image/png"], input=content)
        notification.notify(
            title = 'Synclipboard',
            message = 'Download clipboard success.',
            timeout = 2
        )

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print('Usage: python wayland.py [upload|download]')
        sys.exit(1)
    if sys.argv[1] == 'upload':
        upload()
    elif sys.argv[1] == 'download':
        download()
    else:
        print('Usage: python wayland.py [upload|download]')
        sys.exit(1)