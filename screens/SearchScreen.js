import React from 'react';
import { Text, View, ScrollView, FlatList } from 'react-native';
import db from './config'

export default class Searchscreen extends React.Component {
  constructor(props){
    super(props)
    this.state={allTransactions : [],
                lastVisibleTransaction: null
    }


  } 
  
  componentDidMount = async()=>{
    const query = await db.collection('transactions').get()
    query.docs.map((doc)=>{
      this.setState({allTransactions:[...this.state.allTransactions, doc.data()]})
    })
    
  }
  
  
  fetchMoreTransactions = async() =>{
    const query = db.collection("transactions").startAfter(this.state.lastVisibleTransaction).limit(10).get()
    query.docs.map((doc)=>{
      this.setState({allTransactions:[...this.state.allTransactions, doc.data()], lastVisibleTransaction: doc})
    })
  }
  
  render() {
    console.log(this.state.allTransactions)
      return (
        <FlatList data={this.state.allTransactions} renderItem={(item)=>{
          <View style={{borderBottomWidth: 2}}>
            <Text>{"bookId:"+ item.bookId}</Text>
            <Text>{"StudentId:"+ item.studentId}</Text>
            <Text>{"TransactionType:"+ item.transactionType}</Text>
            <Text>{"Date:"+ item.date}</Text>
          </View>
        }} keyExtractor={(item,index)=>{
          index.toString()  
        }} onEndReached={this.fetchMoreTransactions()} onEndReachedThreshold={0.7}>  
        </FlatList>
      );
    }
  }




