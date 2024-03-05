import React, { useState, useEffect, useRef } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Divider,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Textarea,
} from "@nextui-org/react";
import Image from "next/image";

import mic from "../public/icon-park-outline_voice.svg";
import copy from "../public/tabler_copy.svg";
import record from "../public/record-circle.svg";
import doc from "../public/document-upload.svg";
import sound from "../public/sound.svg";
import edit from "../public/edit-2.svg";
import arrowdown from "../public/arrow-down.svg";
import file from "../public/document-forward.svg";
import { getCurrentDateTime, getJSONdata } from "@/application/utils/functions";
import { Deepgram,createClient, LiveTranscriptionEvents } from "@deepgram/sdk";
import { useRecordVoice } from "@/application/useRecordVoice";
import axiosInstance from "@/application/api/axiosInstance";
import { getEncouterDB, insertTranscriptDB, updateEncounterDB } from "@/application/database/database";
import Loader from "./Loader";
import { generateNote, getTranscript } from "@/application/api/apis";



const PageData=({activeTab,setActiveTab,id,updateTranscript,generateAutoNote,gnote,setGNote}:{activeTab:any,id:any,setActiveTab:any,updateTranscript:any,generateAutoNote:any,gnote:any,setGNote:any})=>{
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState("English (US)");
    const [transcript, setTranscript] = useState("");
    const [isRecording, setIsRecording] = useState(false);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [showNoteCards, setShowNoteCards] = useState(false);
    const [userData,setUserData]=useState<any>()
    const [isListening,setListening]=useState(false);
    const [isLoading,setLoading]=useState(false);
    const languages = ["English", "Spanish", "French", "German"];
    const [allData,setAllData]=useState<any>({})
    const [pnote,setPNote]=useState("");
    

  const [showUploadContent, setShowUploadContent] = useState(false);

  const loadDocument= async ()=>{
    try{
    setGNote(undefined)
  const data = await getEncouterDB(id)
  setAllData(data);
  if(data.note){
  setPNote(data.note) 
  }
  if(data.summary){
  setGNote(JSON.parse(data.summary)) 
  console.log(data.summary)
  }
  if(data.transcript){
  updateTranscript(data.transcript)
  }
  loadTranscriptIfFile(data);
  console.log(data);
    }catch(e){

    }
  }
  const loadTranscriptIfFile= async (data:any)=>{
    try{
    if(data.isFileUsed!=null && data.transcript==null){
        console.log("here")
        const req = await getTranscript(data.isFileUsed);
        if(req.transcription_status=="DONE"){
            updateEncounterDB(id,"transcript",req.text);
            loadDocument();
        }else{
            setTimeout(()=>{
                loadDocument(); 
            },5000)
        }
        console.log(req);
    }}catch(e){
        console.log(e)
    }
  }
  
  useEffect(()=>{
    loadDocument();
    
  },[])

  const handleUploadButtonClick = () => {
    setShowUploadContent(true);
  };
  
  const onBlobUpdate = (blob:any) => {
    // Access the blob data outside the hook
    console.log("Updated blob data:", blob);
    // Process or use the blob data as needed
  };
  const recordData = useRecordVoice();

  const startRecording = async () => {
    try {
      setIsRecording(true);
      recordData.startRecording();
      //sendData();
      
    } catch (error) {
        console.error('Error accessing microphone:', error);
    }
};


const stopRecording = async () => {
 recordData.stopRecording();
 console.log(recordData.recordedBlob,"heyy")
 if(recordData.recordedBlob){
  const uurl = URL.createObjectURL(recordData.recordedBlob);
  const audioElement = new Audio(uurl);
  audioElement.play();
  processDeepGram(uurl)
 
 }
    setIsRecording(false);

}
const sendData = async () => {
 
}


  // Function to pause recording
  const pauseRecording = () => {};

  // Function to resume recording
  const resumeRecording = () => {};
  
  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
  };

  let deepgramConnection:any;
    //let cn=0;
    const processDeepGram = async (audioBuffer:any) => {
        //const blob = new Blob([audioBuffer], { type: "audio/wav" });
        //console.log(blob)
        //const url = window.URL.createObjectURL(blob);
      
        try {
          // Initialize the connection only if it's not already set
          if (!deepgramConnection) {
              const deepgram = createClient("f3a5bc99cd3475e419b506390921a9fab2660b9a");
    
              deepgramConnection = deepgram.listen.live({
                  model: "nova-2",
                  language: "en-US",
                  smart_format: true,
              });
    
              deepgramConnection.on(LiveTranscriptionEvents.Open, () => {
                  console.log("Connection opened.");
                  setListening(true)
              });
    
              deepgramConnection.on(LiveTranscriptionEvents.Close, () => {
                  console.log("Connection closed.");
                  setListening(false)
                  deepgramConnection=null;
              });
    
              deepgramConnection.on(LiveTranscriptionEvents.Transcript, (data:any) => {
                  console.log("Transcript:", data.channel.alternatives[0].transcript);
                  // Process the transcript data as needed
              });
    
              deepgramConnection.on(LiveTranscriptionEvents.Metadata, (data:any) => {
                  console.log("Metadata:", data);
                  // Process metadata as needed
              });
    
              deepgramConnection.on(LiveTranscriptionEvents.Error, (err:any) => {
                  console.error("Error:", err);
              });
          }
    
          // Send the audio buffer to the existing connection
          if(isListening){
          deepgramConnection.send(audioBuffer);
          }
      } catch (error) {
          console.error('Error processing audio with Deepgram SDK:', error);
      }
      };
      const uploadFileTrans = async (file:any) => {
        setLoading(true);
      
        try {
          const formData = new FormData();
          formData.append('audio_file', file);
      
          // Assuming you have an axios instance named 'axiosInstance' configured with your API base URL
          const response = await axiosInstance.post('/transcription/upload-audio', formData);
      
          // Handle the response from the server
          console.log('Upload successful:', response.data);
          //insertTranscriptDB(file.name,"",response.data.status_id,"","",getCurrentDateTime())
          await updateEncounterDB(id,"isFileUsed",response.data.status_id);
          loadDocument();
          setLoading(false);
      
          // You can perform additional actions with the response data if needed
      
        } catch (error) {
          // Handle errors during file upload
          console.error('Error uploading file:', error);
        } finally {
          setLoading(false);
        }
      };
      const generateMainNote= async ()=>{
        try{
            setLoading(true);
        const data = await generateAutoNote();
        setLoading(false);
        if(data){
            //setGNote(data);
        }
        }catch(e){
            console.log(e)
            setLoading(false);
        }
      }
    return (
        <div className="h-full">
        {activeTab === "transcript" && !isRecording && (allData.transcript=="" || allData.transcript==null ) && (allData.isFileUsed==null) && (
          <div className="h-full flex justify-center items-center">
            <div className="p-4 relative max-w-xl w-full">
              <Card className="w-full lg:w-[450px]">
                <CardHeader className="flex justify-between items-center">
                  <div className="flex">
                    <h1 className="font-semibold mr-2">Documentation</h1>
                    <Image src={edit} alt="" />
                  </div>
                  <Dropdown>
                    <DropdownTrigger className="rounded-full">
                      <Button
                        variant="bordered"
                        className="capitalize font-medium"
                      >
                        {selectedLanguage}
                        <Image src={arrowdown} alt="arrowdown" />
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu
                      aria-label="Select Language"
                      variant="flat"
                      disallowEmptySelection
                      selectionMode="single"
                      selectedKeys={selectedLanguage}
                      onSelectionChange={(language) =>
                        handleLanguageChange(language as string)
                      }
                    >
                      {languages.map((language) => (
                        <DropdownItem key={language}>{language}</DropdownItem>
                      ))}
                    </DropdownMenu>
                  </Dropdown>
                </CardHeader>
                <Divider className="" />
                <CardBody className="flex justify-center items-center flex-col">
                  {showUploadContent ? (
                    <div className="justify-center items-center flex flex-col ">
                      <Image src={file} alt="" className="mt-10" />
                      <h1 className="font-semibold text-lg mt-2">
                        Upload Audio
                      </h1>
                      <p className="text-center text-lg p-3 text-[#808080]">
                        Supported files: MP3, WAV, M4A
                      </p>
                      <label>
                      <div
                        className="z-0 group relative inline-flex items-center justify-center box-border appearance-none select-none whitespace-nowrap font-normal subpixel-antialiased overflow-hidden tap-highlight-transparent outline-none data-[focus-visible=true]:z-10 data-[focus-visible=true]:outline-2 data-[focus-visible=true]:outline-focus data-[focus-visible=true]:outline-offset-2 px-unit-6 min-w-unit-24 h-unit-12 text-medium gap-unit-3 rounded-large [&>svg]:max-w-[theme(spacing.unit-8)] data-[pressed=true]:scale-[0.97] transition-transform-colors-opacity motion-reduce:transition-none text-default-foreground data-[hover=true]:opacity-hover w-full md:w-[300px] bg-[#008080] mt-6 mb-6"
                        
                      >
                        <h1 className="text-white font-bold">Upload Audio</h1>
                      </div>
                      <input type="file" style={{display:"none"}} onChange={(e:any)=>{
                        uploadFileTrans(e.target.files[0]); 
                      }} />
                      </label>
                    </div>
                  ) : (
                    <div className="justify-center items-center flex flex-col ">
                      <Image src={sound} alt="" className="mt-10" />
                      <p className="text-center max-w-xl mt-6 p-3 text-[#808080]">
                        To ensure we can hear you, make sure your microphone
                        settings are correct
                      </p>

                      <Button
                        onClick={startRecording}
                        size="lg"
                        className="w-full bg-[#008080] mt-10"
                      >
                        <Image src={record} alt="" />
                        <h1 className="text-white font-bold">
                          Record Conversation
                        </h1>
                      </Button>

                      <div className="flex items-center mt-4">
                        <div className="flex-1 h-[1px] bg-black"></div>
                        <div className="mx-4 text-gray-500 font-semibold">
                          or
                        </div>
                        <div className="flex-1 h-[1px] bg-black"></div>
                      </div>

                      <button
                        type="button"
                        onClick={handleUploadButtonClick}
                        className="w-full md:w-[300px] mt-2 mb-6"
                      >
                        <div className="flex justify-center  mt-2">
                          <Image src={doc} alt="" className="mr-2" />
                          <h1 className="font-semibold text-[#008080]">
                            Upload Recordings
                          </h1>
                        </div>
                      </button>
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "transcript" && allData.isFileUsed!=null && allData.transcript==null && (
            <div className="flex items-center justify-center h-screen">
            <Loader />
            <div className="ml-4">Generating Transcript</div>
          </div>
        ) }
        {activeTab === "transcript" &&  allData.transcript!=null  && allData.transcript!="" && (
            <div>
               {allData.transcript} 
               <Button className="button" onClick={ ()=>{
              
                generateMainNote()
               }}>
                Generate Note
               </Button>
            </div>
        ) }
        <div>
          {activeTab === "note" && gnote!=undefined && (
            <div className="p-4 justify-between flex-col sm:flex-row">
              <div className="flex flex-col sm:flex-row gap-4 flex-grow justify-between mb-6">
                <Card className="w-full sm:w-1/2">
                  <CardBody>
                    <CardHeader>
                      <h1 className="font-semibold">OBJECTIVE</h1>
                    </CardHeader>
                    <div className="p-4">
                    {gnote.objective}
                    </div>
                    <div className="flex p-4 gap-2">
                      <button>
                        <Image src={mic} alt="" />
                      </button>
                      <button>
                        <Image src={copy} alt="" />
                      </button>
                    </div>
                  </CardBody>
                </Card>
                <Card className="w-full sm:w-1/2">
                  <CardBody>
                    <CardHeader>
                      <h1 className="font-bold">SUBJECTIVE</h1>
                    </CardHeader>
                    <div className="p-4">
                    {gnote.subjective}
                    </div>
                    <div className="flex p-4 gap-2">
                      <button type="button">
                        <Image src={mic} alt="" />
                      </button>
                      <button type="button">
                        <Image src={copy} alt="" />
                      </button>
                    </div>
                  </CardBody>
                </Card>
              </div>

              {/* Second Row */}
              <div className="flex flex-col sm:flex-row gap-4 flex-grow justify-between mb-4">
                <Card className="w-full sm:w-1/2">
                  <CardBody>
                    <CardHeader>
                      <h1 className="font-semibold">ASSESSMENT</h1>
                    </CardHeader>
                    <div className="p-4">
                    {gnote.assessment}
                    </div>
                    <div className="flex p-4 gap-2">
                      <button type="button">
                        <Image src={mic} alt="" />
                      </button>
                      <button type="button">
                        <Image src={copy} alt="" />
                      </button>
                    </div>
                  </CardBody>
                </Card>
                <Card className="w-full sm:w-1/2">
                  <CardBody>
                    <CardHeader>
                      <h1 className="font-bold">PLAN</h1>
                    </CardHeader>
                    <div className="p-4">
                        {gnote.plan}
                   
                    </div>
                    <div className="flex p-4 gap-2">
                      <button type="button">
                        <Image src={mic} alt="" />
                      </button>
                      <button type="button">
                        <Image src={copy} alt="" />
                      </button>
                    </div>
                  </CardBody>
                </Card>
              </div>
              {/* Second Row */}
              <div className="flex flex-col sm:flex-row gap-4 flex-grow justify-between">
                <Card className="w-full sm:w-1/2">
                  <CardBody>
                    <CardHeader>
                      <h1 className="font-semibold">PRESCRIPTIONS</h1>
                    </CardHeader>
                    <div className="p-4">
                      <p className="list-dot">50 dosage of ibuprofen</p>
                    </div>
                    <div className="flex p-4 gap-2">
                      <button type="button">
                        <Image src={mic} alt="" />
                      </button>
                      <button type="button">
                        <Image src={copy} alt="" />
                      </button>
                    </div>
                  </CardBody>
                </Card>
                <Card className="w-full sm:w-1/2">
                  <CardBody>
                    <CardHeader>
                      <h1 className="font-bold">APPOINTMENT</h1>
                    </CardHeader>
                    <div className="p-4">
                      <p className="list-dot">
                        follow up check on the 24th February
                      </p>
                    </div>
                    <div className="flex p-4 gap-2">
                      <button type="button">
                        <Image src={mic} alt="" />
                      </button>
                      <button type="button">
                        <Image src={copy} alt="" />
                      </button>
                    </div>
                  </CardBody>
                </Card>
              </div>
            </div>
          )}
          {activeTab === "note" && (
            <div className="p-4 mt-4">
               
              <Card className="w-full bg-white">
                <CardBody>
                  {/* Your "Note" content here */}
                  <h1 className="mt-4 font-medium text-[#1E1E1E]">
                    PERSONALIZED NOTE
                  </h1>
                  <Textarea
                    className=" rounded-lg  mb-4 mt-4"
                    placeholder="Type anything here....."
                    value={pnote}
                    onChange={(e)=>{
                      setPNote(e.target.value)  
                      updateEncounterDB(id,"note",e.target.value)
                    }}
            
                  />
                </CardBody>
              </Card>
              
            </div>
          )}
        </div>

        {activeTab === "transcript" && isRecording && (
          <div className="flex mt-6 justify-between p-4">
            <div className="p-4">
              {/* <p>{recordingDuration}</p> */}
              <p className="text-black">{transcript}</p>
            </div>
            <div className="flex bg-[#E5E8EC] h-16 rounded-full px-6 py-2 gap-4 ">
              {/* pause recording */}
              <button type="button" onClick={pauseRecording}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="25"
                  height="25"
                  viewBox="0 0 26 26"
                >
                  <path
                    fill="currentColor"
                    d="M7 5c-.551 0-1 .449-1 1v14c0 .551.449 1 1 1h3c.551 0 1-.449 1-1V6c0-.551-.449-1-1-1H7zm9 0c-.551 0-1 .449-1 1v14c0 .551.449 1 1 1h3c.551 0 1-.449 1-1V6c0-.551-.449-1-1-1h-3z"
                  />
                </svg>
              </button>

              {/* Stop recording */}
              <button type="button" onClick={stopRecording}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 432 432"
                >
                  <path
                    fill="#257442"
                    d="M213.5 3q88.5 0 151 62.5T427 216t-62.5 150.5t-151 62.5t-151-62.5T0 216T62.5 65.5T213.5 3z"
                  />
                </svg>
              </button>

              {/* Hold Recording */}
              <button type="button" onClick={resumeRecording}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="25"
                  height="35"
                  viewBox="0 0 26 26"
                >
                  <path
                    fill="currentColor"
                    d="M21 20c0 .551-.449 1-1 1H6c-.551 0-1-.449-1-1V6c0-.551.449-1 1-1h14c.551 0 1 .449 1 1v14z"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
        {isLoading && <Loader type={'FULL'}/>}
      </div>
    )
}

export default PageData