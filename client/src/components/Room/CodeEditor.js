import AceEditor from 'react-ace';

// import "ace-builds/src-min-noconflict/ext-language_tools";
import 'ace-builds/src-noconflict/ext-language_tools';
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/snippets/javascript';
import 'ace-builds/src-noconflict/theme-monokai';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { initSocket } from '../../helpers/Socket';
import { ACTIONS } from '../../helpers/Actions';

const CodeEditor = () => {
  const [fontSize, setFontSize] = useState(16);
  const [mainEditor, setMainEditor] = useState('');
  const [inputEditor, setInputEditor] = useState('');
  const [outputEditor, setOutputEditor] = useState('');
  const navigate = useNavigate();
  let socketRef = useRef(null);
  const { roomId } = useParams();
  const { user } = useSelector((state) => state.user);
  const [users, setUsers] = useState([]);
  console.log(users);

  const aceEditorStyles = {
    borderBottomLeftRadius: '16px',
    borderBottomRightRadius: '16px',
  };

  function handleEditorChange({ editor, code }) {
    console.log(code);
    if (editor === 'main') setMainEditor(code);
    else if (editor === 'input') setInputEditor(code);
    else setOutputEditor(code);
    socketRef.current?.emit(ACTIONS.CODE_CHANGE, { roomId, editor, code });
  }

  // Socket
  useEffect(() => {
    const initialize = async () => {
      try {
        socketRef.current = await initSocket();

        socketRef.current.on('connect_error', (err) => {
          toast.error('Socket connection failed, try again later.');
          navigate('/dashboard');
        });

        socketRef.current.emit(ACTIONS.JOIN, {
          roomId,
          username: user.name,
        });

        socketRef.current.on(ACTIONS.JOIN, ({ users, username }) => {
          console.log(username);
          setUsers(users);
          if (username !== user.name) {
            toast.success(`${username} joined the room.`);
            console.log('message: ', mainEditor, user.name);
            socketRef.current.emit(ACTIONS.CODE_CHANGE, { roomId, editor: 'main', mainEditor });
            socketRef.current.emit(ACTIONS.CODE_CHANGE, { roomId, editor: 'input', inputEditor });
            socketRef.current.emit(ACTIONS.CODE_CHANGE, { roomId, editor: 'output', outputEditor });
          }
        });

        socketRef.current.on(ACTIONS.CODE_CHANGE, ({ editor, code }) => {
          if (editor === 'main') setMainEditor(code);
          else if (editor === 'input') setInputEditor(code);
          else setOutputEditor(code);
        });

        socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
          toast.success(`${username} left the room.`);
          setUsers((currUsers) => {
            return currUsers.filter((user) => user.socketId !== socketId);
          });
        });
      } catch (err) {
        toast.error(err.message);
      }
    };

    initialize();

    return () => {
      socketRef.current.disconnect();
      //socketRef.current.offAny(); // Check more details about this. Used to remove listeners.
    };
  }, []);

  return (
    <div className='grid grid-rows-5 gap-3 h-full'>
      <div className='row-span-3' id='code-editor'>
        <div className='p-2 pl-10 text-slate-200 rounded-t-2xl' style={{ backgroundColor: 'rgb(47, 49, 41)' }}>
          Code
        </div>
        <AceEditor
          mode='javascript'
          theme='monokai'
          name='code-main'
          onChange={(code) => handleEditorChange({ editor: 'main', code })}
          value={mainEditor}
          fontSize={fontSize}
          setOptions={{
            useWorker: false,
            enableBasicAutocompletion: true,
            enableLiveAutocompletion: true,
            enableSnippets: true,
            showPrintMargin: false,
          }}
          height='92%'
          width='100%'
          style={aceEditorStyles}
        />
      </div>
      <div className='row-span-2'>
        <div className='grid grid-cols-2 gap-3 h-full'>
          <div id='code-input'>
            <div className='p-2 pl-10 text-slate-200 rounded-t-2xl' style={{ backgroundColor: 'rgb(47, 49, 41)' }}>
              Input
            </div>
            <AceEditor
              mode='javascript'
              theme='monokai'
              name='code-input'
              onChange={(e) => handleEditorChange({ editor: 'input', main: e.target.value })}
              value={inputEditor}
              fontSize={fontSize}
              setOptions={{
                useWorker: false,
                enableBasicAutocompletion: true,
                enableLiveAutocompletion: true,
                enableSnippets: true,
                showPrintMargin: false,
              }}
              height='89%'
              width='100%'
              style={aceEditorStyles}
            />
          </div>
          <div id='code-output'>
            <div className='p-2 pl-10 text-slate-200 rounded-t-2xl' style={{ backgroundColor: 'rgb(47, 49, 41)' }}>
              Output
            </div>
            <AceEditor
              mode='javascript'
              theme='monokai'
              name='code-output'
              onChange={(e) => handleEditorChange({ editor: 'output', main: e.target.value })}
              value={outputEditor}
              fontSize={fontSize}
              setOptions={{
                useWorker: false,
                enableBasicAutocompletion: true,
                enableLiveAutocompletion: true,
                enableSnippets: true,
                showPrintMargin: false,
              }}
              height='89%'
              width='100%'
              style={aceEditorStyles}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
