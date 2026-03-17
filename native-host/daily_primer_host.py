#!/usr/bin/env python3
"""Native messaging host for Daily Primer extension.
Reads files from disk on request."""

import sys
import json
import struct
import os


def read_message():
    raw_length = sys.stdin.buffer.read(4)
    if not raw_length or len(raw_length) < 4:
        return None
    length = struct.unpack('<I', raw_length)[0]
    data = sys.stdin.buffer.read(length)
    return json.loads(data)


def send_message(msg):
    data = json.dumps(msg).encode('utf-8')
    sys.stdout.buffer.write(struct.pack('<I', len(data)))
    sys.stdout.buffer.write(data)
    sys.stdout.buffer.flush()


def main():
    msg = read_message()
    if not msg:
        return

    if msg.get('type') == 'read_file':
        path = os.path.expanduser(msg.get('path', ''))
        try:
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            send_message({'success': True, 'content': content})
        except FileNotFoundError:
            send_message({'success': False, 'error': 'not_found'})
        except Exception as e:
            send_message({'success': False, 'error': str(e)})
    elif msg.get('type') == 'list_files':
        directory = os.path.expanduser(msg.get('path', ''))
        try:
            files = [f for f in os.listdir(directory) if f.endswith('.md')]
            send_message({'success': True, 'files': files})
        except FileNotFoundError:
            send_message({'success': False, 'error': 'not_found'})
        except Exception as e:
            send_message({'success': False, 'error': str(e)})
    else:
        send_message({'success': False, 'error': 'unknown_type'})


if __name__ == '__main__':
    main()
