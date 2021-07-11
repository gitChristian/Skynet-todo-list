import React, { useState, useEffect } from 'react';
import { Spinner } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

//mock data
import data from "./data.json";
//components
import Header from "./Header";
import ToDoList from "./ToDoList";
import ToDoForm from './ToDoForm';

// Import the SkynetClient and a helper
import { SkynetClient } from 'skynet-js';

// We'll define a portal to allow for developing on localhost.
// When hosted on a skynet portal, SkynetClient doesn't need any arguments.
// const portal =
//   window.location.hostname === 'localhost' ? 'https://siasky.net' : undefined;
// Initiate the SkynetClient
const client = new SkynetClient();

function App() {
  const [ toDoList, setToDoList ] = useState([]);
  const [userID, setUserID] = useState();
  const [mySky, setMySky] = useState();
  const [loggedIn, setLoggedIn] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  // choose a data domain for saving files in MySky
  const dataDomain = 'localhost';
  const filePath = dataDomain + '/chris';
  // On initial run, start initialization of MySky
  useEffect(() => {
    // define async setup function
    async function initMySky() {
      try {
        // load invisible iframe and define app's data domain
        // needed for permissions write
        const mySky = await client.loadMySky(dataDomain);
        // load necessary DACs and permissions
        // await mySky.loadDacs(contentRecord);
        // check if user is already logged in with permissions
        const loggedIn = await mySky.checkLogin();
        // set react state for login status and
        // to access mySky in rest of app
        setMySky(mySky);
        setLoggedIn(loggedIn);
        if (loggedIn) {
          setUserID(await mySky.userID());
          loadJSON(mySky);
        }else{
          setToDoList(data)
        }
      } catch (e) {
        console.error(e);
      }
    }
    initMySky();
  }, []);

  const loadJSON = async (mySky) => {
    try {
      setLoading(true);
      const { data } = await mySky.getJSON(filePath);
      setLoading(false);
      setToDoList(data);
    } catch (error) {
      alert('Could not load your list, please refresh the page and try again.')
      setLoading(false);
      console.log(`error with getJSON: ${error.message}`);
    }
  }

  const submitJSON = async (json) => {
    try {
      // write data with MySky
      setUploading(true);
      await mySky.setJSON(filePath, json);
      setUploading(false);
    } catch (error) {
      console.log(`error with setJSON: ${error.message}`);
      alert("Could not save to Skynet, please try again.");
      setUploading(false);
    }
  }


  const handleSave = () => {
      submitJSON(toDoList);
  }

  const handleToggle = (id) => {
    let mapped = toDoList.map(task => {
      return task.id === Number(id) ? { ...task, complete: !task.complete } : { ...task};
    });
    setToDoList(mapped);
  }

  const handleFilter = () => {
    let filtered = toDoList.filter(task => {
      return !task.complete;
    });
    setToDoList(filtered);
  }

  const addTask = (userInput ) => {
    let copy = [...toDoList];
    copy = [...copy, { id: toDoList.length + 1, task: userInput, complete: false }];
    setToDoList(copy);
  }

  const handleMySkyLogin = async () => {
    // Try login again, opening pop-up. Returns true if successful
    const status = await mySky.requestLoginAccess();
    // set react state
    setLoggedIn(status);
    if (status) {
      setUserID(await mySky.userID());
      loadJSON(mySky)
    }
  };

  const handleMySkyLogout = async () => {
    // call logout to globally logout of mysky
    await mySky.logout();
    //set react state
    setLoggedIn(false);
    setUserID('');
    setToDoList(data)
  };

  return (
    <div className="App">
      <Header />

      {loggedIn === true && (
        <>
        <button style={{margin: '20px'}} onClick={handleMySkyLogout}>
          Log Out of MySky
        </button>
        {loading && <Spinner animation="border" variant="success" />}
        </>
      )}
      {loggedIn === false && (
        <button style={{margin: '20px', color: 'green'}}  onClick={handleMySkyLogin}>
          Login with MySky
        </button>
      )}

      <ToDoList toDoList={toDoList} handleToggle={handleToggle} handleFilter={handleFilter}/>
      <ToDoForm addTask={addTask}/>

      {loggedIn === true && (
          <button  style={{margin: '20px'}} onClick={handleSave}  disabled={uploading}>
            { uploading && <><span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> 
              <span>uploading...</span> </> }
            { !uploading && "Save To Skynet"}
          </button> 
      )}

    </div>
  );
}

export default App;
