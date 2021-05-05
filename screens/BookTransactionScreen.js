import React from 'react';
import { Text, View, TouchableOpacity, TextInput, Image, StyleSheet,ToastAndroid,Alert} from 'react-native';
import * as Permissions from 'expo-permissions';
import { BarCodeScanner } from 'expo-barcode-scanner';
import firebase from 'firebase';
import db from './config';

export default class TransactionScreen extends React.Component {
  constructor(){
    super();
    this.state = {
      hasCameraPermissions : null,
      scanned : false,
      scannedBookId : '',
      scannedStudentId : '',
      buttonState : 'normal',
      transactionMessage : ''
    }
  }

  getCameraPermissions = async (id) =>{
    const {status}  = await Permissions.askAsync(Permissions.CAMERA);

    this.setState({
      /*status === "granted" is true when user has granted permission
        status === "granted" is false when user has not granted the permission
      */
      hasCameraPermissions : status === "granted",
      buttonState : id,
      scanned : false
    })
  }

  handleBarCodeScanned  = async ({type, data})=>{
    const { buttonState} = this.state

    if(buttonState === "BookId"){
      this.setState({
        scanned : true,
        scannedBookId : data,
        buttonState : 'normal'
      });
    }
    else if(buttonState === "StudentId"){
      this.setState({
        scanned : true,
        scannedStudentId : data,
        buttonState : 'normal'
      })
    }
  }

  initiateBookIssue = async ()=>{
    //add a transaction
    db.collection("transactions").add({
      'studentId' : this.state.scannedStudentId,
      'bookId' : this.state.scannedBookId,
      'data' : firebase.firestore.Timestamp.now().toDate(),
      'transactionType' : "Issue"
    })

    //change book status
    db.collection("books").doc(this.state.scannedBookId).update({
      'bookAvailability' : false
    })
    //change number of issued books for student
    db.collection("students").doc(this.state.scannedStudentId).update({
      'numberOfBooksIssued' : firebase.firestore.FieldValue.increment(1)
    })

    this.setState({
      scannedStudentId : '',
      scannedBookId: ''
    })
  }

  initiateBookReturn = async ()=>{
    //add a transaction
    db.collection("transactions").add({
      'studentId' : this.state.scannedStudentId,
      'bookId' : this.state.scannedBookId,
      'date'   : firebase.firestore.Timestamp.now().toDate(),
      'transactionType' : "Return"
    })

    //change book status
    db.collection("books").doc(this.state.scannedBookId).update({
      'bookAvailability' : true
    })

    //change book status
    db.collection("students").doc(this.state.scannedStudentId).update({
      'numberOfBooksIssued' : firebase.firestore.FieldValue.increment(-1)
    })

    this.setState({
      scannedStudentId : '',
      scannedBookId : ''
    })
  }

  checkStudentEligibilityforIssue = async() =>{
    const studentRef = await db.collection("students").where("studentId", "==", this.state.scannedStudentId).get()
    var isStudentEligible = ""
    if(studentRef.docs.length === 0){
      this.setState({scannedBookId: "", scannedStudentId: ""})
      isStudentEligible = false
      alert("The Student Id does not exist")
    }

    else{
      studentRef.docs.map( (doc) =>{
        var student = doc.data()
        if(student.numberOfBooksIssued < 2){
          isStudentEligible = true
        }

        else{
          isStudentEligible = false
          alert("The student has already borrowed two books")
          this.setState({scannedBookId:"", scannedStudentId: ""})
        }
      })
    }

    return isStudentEligible
  }


  checkStudentEligibilityforReturn = async() =>{
    const transactionRef = await db.collection("transactions").where("bookId", "==", this.state.scannedBookId).limit(1).get()
    var isStudentEligible = ""
    transactionRef.docs.map((doc) =>{
      var lastBookTransaction = doc.data()
      if(lastBookTransaction.studentId === this.state.scannedStudentId){
        isStudentEligible = true
      }
      else{
        isStudentEligible = false
        alert("The book was not taken by this student")
        this.setState({scannedBookId:"", scannedStudentId:""})
      }
    })
    return isStudentEligible
  }

  checkBookEligibility = async()=>{
    const bookRef = await db.collection("books").where("bookId", "==", this.state.scannedBookId).get()
    var transactionType = ""
    if(bookRef.docs.length === 0){
      transactionType = false
    }

    else{
      bookRef.docs.map((doc)=>{
        var book = doc.data()
        if(book.bookAvailability){
          transactionType = "Issue"
        }
        else{
          transactionType = "Return" 
        }
      })
    }
    return transactionType
  }




  handleTransaction = async()=>{
    // var transactionMessage = null;
    // db.collection("books").doc(this.state.scannedBookId).get()
    // .then((doc)=>{

    //      var book = doc.data()
    //   if(book.bookAvailability){
    //     this.initiateBookIssue();
    //     transactionMessage = "Book Issued"
    //     // ToastAndroid.show(transactionMessage, ToastAndroid.SHORT)
    //     alert(transactionMessage)
    //   }
    //   else{
    //     this.initiateBookReturn();
    //     transactionMessage = "Book Returned"

    //     // ToastAndroid.show(transactionMessage, ToastAndroid.SHORT)
    //     alert(transactionMessage)
    //    }


    // })

    // this.setState({
    //   transactionMessage : transactionMessage
    // })
    var transactionType = await this.checkBookEligibility()
    if(!transactionType){
      alert("The book is not available")
      this.setState({scannedBookId:"", 
      scannedStudentId:""
    })
    }

    else if(transactionType === "Issue"){
      var isStudentEligible = await this.checkStudentEligibilityforIssue()
      if(isStudentEligible){
        this.initiateBookIssue()
        alert("The book is issued to the student")
      }
    }

    else {
      var isStudentEligible = await this.checkStudentEligibilityforReturn()
      if(isStudentEligible){
        this.initiateBookReturn()
        alert("The book is returned to the library")
      }
    }

  }

  render(){
    const hasCameraPermissions = this.state.hasCameraPermissions;
    const scanned = this.state.scanned;
    const buttonState = this.state.buttonState;

    if(buttonState !== "normal" && hasCameraPermissions){
      return(
        <BarCodeScanner
          onBarCodeScanned = {scanned ? undefined : this.handleBarCodeScanned}
          style = {StyleSheet.absoluteFillObject}
        />
      );
    }

    else if (buttonState === "normal"){
      return(
        <View style={styles.container}>
        <View>
          <Image
            source = {require("../assets/booklogo.jpg")}
            style= {{width:200, height:200}}/>
          <Text style={{textAlign:'center', fontSize:30,}}>Wily</Text>
        </View>
        <View style={styles.inputView}>
        <TextInput
          style={styles.inputBox}
          placeholder="Book Id"
          value={this.state.scannedBookId}
          onChangeText={(text)=>{this.setState({scannedBookId:text})}}/>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={()=>{
            this.getCameraPermissions("BookId")
          }}>
          <Text style={styles.buttonText}>Scan</Text>
        </TouchableOpacity>
        </View>

        <View style={styles.inputView}>
        <TextInput
          style={styles.inputBox}
          placeholder="Student Id"
          value={this.state.scannedStudentId}
          onChangeText={(text)=>{this.setState({scannedStudentId:text})}}/>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={()=>{
            this.getCameraPermissions("StudentId")
          }}>
          <Text style={styles.buttonText}>Scan</Text>
        </TouchableOpacity>
        </View>
        <Text style={styles.transactionAlert}>{this.state.transactionMessage}</Text>
        <TouchableOpacity
          style={styles.submitButton}
          onPress={async()=>{
            var transactionMessage = await this.handleTransaction();
            this.setState({scannedBookId:'', scannedStudentId:''})

          }}>
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
      </View>
      )
    }
  }
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  displayText:{
    fontSize: 15,
    textDecorationLine: 'underline'
  },
  scanButton:{
    backgroundColor: '#2196F3',
    padding: 10,
    margin: 10
  },
  buttonText:{
    fontSize: 15,
    textAlign: 'center',
    marginTop: 10
  },
  inputView:{
    flexDirection: 'row',
    margin: 20
  },
  inputBox:{
    width: 200,
    height: 40,
    borderWidth: 1.5,
    borderRightWidth: 0,
    fontSize: 20
  },
  scanButton:{
    backgroundColor: '#66BB6A',
    width: 50,
    borderWidth: 1.5,
    borderLeftWidth: 0
  },
  submitButton:{
    backgroundColor: '#FBC02D',
    width: 100,
    height:50
  },
  submitButtonText:{
    padding: 10,
    textAlign: 'center',
    fontSize: 20,
    fontWeight:"bold",
    color: 'white'
  }
});