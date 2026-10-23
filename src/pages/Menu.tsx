import {
  IonPage,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonInput,
  IonButton,
  IonCard,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
} from '@ionic/react';

const Menu = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Menu</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* Add Food */}
        <IonCard>
          <IonCardContent>
            <h2>Add Food Item</h2>

            <IonGrid>
              <IonRow>
                <IonCol size="4">
                  <IonInput placeholder="Food Name" />
                </IonCol>
                <IonCol size="4">
                  <IonInput placeholder="Price" type="number" />
                </IonCol>
                <IonCol size="4">
                  <IonInput placeholder="Category" />
                </IonCol>
              </IonRow>

              <IonRow>
                <IonCol size="12">
                  <IonButton expand="block">Add Item</IonButton>
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonCardContent>
        </IonCard>

        {/* List */}
        <IonCard>
          <IonCardContent>
            <h2>Menu List</h2>

            <IonGrid>
              <IonRow>
                <IonCol size="4"><b>Name</b></IonCol>
                <IonCol size="4"><b>Price</b></IonCol>
                <IonCol size="4"><b>Category</b></IonCol>
              </IonRow>

              <IonRow>
                <IonCol size="4">Pizza</IonCol>
                <IonCol size="4">₹299</IonCol>
                <IonCol size="4">Fast Food</IonCol>
              </IonRow>
            </IonGrid>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default Menu;