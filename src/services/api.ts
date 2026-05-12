import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  orderBy, 
  limit, 
  DocumentData,
  QueryConstraint
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../lib/firebase';
import { Product, Order, ProductType, Review, Profile, Job, Notification as AppNotification, Ticket, Conversation, SubscriptionPlan, AppSettings, JobApplication } from '../types';

export interface UploadProgress {
  mainFile: number;
  screenshots: number[];
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const api = {
  admin: {
    async getAllUsers() {
      const path = 'profiles';
      try {
        const snapshot = await getDocs(collection(db, path));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Profile[];
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, path);
        return [];
      }
    },
    async getAllOrders() {
      const path = 'orders';
      try {
        const snapshot = await getDocs(collection(db, path));
        return await Promise.all(snapshot.docs.map(async (d) => {
          const data = d.data() as Order;
          const productDoc = await getDoc(doc(db, 'products', data.product_id));
          const buyerDoc = await getDoc(doc(db, 'profiles', data.buyer_id));
          const sellerDoc = await getDoc(doc(db, 'profiles', data.seller_id));
          return {
            ...data,
            id: d.id,
            product: productDoc.exists() ? productDoc.data() as Product : undefined,
            buyer: buyerDoc.exists() ? buyerDoc.data() as Profile : undefined,
            seller: sellerDoc.exists() ? sellerDoc.data() as Profile : undefined
          };
        }));
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, path);
        return [];
      }
    },
    async getAllWithdrawals() {
      const path = 'withdrawals';
      try {
        const q = query(collection(db, path), orderBy('created_at', 'desc'));
        const snapshot = await getDocs(q);
        return await Promise.all(snapshot.docs.map(async (d) => {
          const data = d.data();
          const userDoc = await getDoc(doc(db, 'profiles', data.user_id));
          return { id: d.id, ...data, user: userDoc.exists() ? userDoc.data() : undefined } as any;
        }));
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, path);
        return [];
      }
    },
    async updateWithdrawalStatus(id: string, status: 'completed' | 'rejected') {
      const path = 'withdrawals';
      try {
         await updateDoc(doc(db, path, id), { status });
      } catch (error) {
         handleFirestoreError(error, OperationType.UPDATE, path);
         throw error;
      }
    },
    async findAnyAsset(id: string) {
      // Check products
      const pDoc = await getDoc(doc(db, 'products', id));
      if (pDoc.exists()) return { type: 'products', ...pDoc.data() };
      // Check jobs
      const jDoc = await getDoc(doc(db, 'jobs', id));
      if (jDoc.exists()) return { type: 'jobs', ...jDoc.data() };
      return null;
    },
    async transferOwnership(id: string, newOwnerId: string, type: string) {
      const path = type; 
      try {
         await updateDoc(doc(db, path, id), { 
           [type === 'products' ? 'creator_id' : 'client_id']: newOwnerId 
         });
      } catch (error) {
         handleFirestoreError(error, OperationType.UPDATE, path);
         throw error;
      }
    },
    async updateOrderStatus(orderId: string, status: string) {
      const path = 'orders';
      try {
         await updateDoc(doc(db, path, orderId), { status });
      } catch (error) {
         handleFirestoreError(error, OperationType.UPDATE, path);
         throw error;
      }
    },
    async toggleUserBlock(userId: string, isBlocked: boolean) {
      const path = 'profiles';
      try {
        await updateDoc(doc(db, path, userId), { status: isBlocked ? 'blocked' : 'active' });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
        throw error;
      }
    },
    async toggleVerification(userId: string, isVerified: boolean) {
      const path = 'profiles';
      try {
        await updateDoc(doc(db, path, userId), { verification_badge: isVerified });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
        throw error;
      }
    },
    async getSettings(): Promise<AppSettings> {
      const path = 'settings';
      const DEFAULT_SETTINGS: AppSettings = {
        site_name: 'NEXUS',
        commission_rate: 10,
        maintenance_mode: false,
        subscription_mode: false,
        commission_mode: true,
        plans: {
          pro: { price: 29.99, features: ['Unlimited Assets', 'Featured Listings (3)', '2.5% Commission'] },
          premium: { price: 99.99, features: ['Unlimited Assets', 'Priority Support', 'Featured Listings (10)', '0% Commission'] }
        },
        global_discount: 0
      };
      try {
        const docSnap = await getDoc(doc(db, path, 'global'));
        if (docSnap.exists()) {
          const data = docSnap.data();
          return {
            ...DEFAULT_SETTINGS,
            ...data
          } as AppSettings;
        }
        return DEFAULT_SETTINGS;
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, path);
        return DEFAULT_SETTINGS;
      }
    },
    async updateSettings(settings: Partial<AppSettings>) {
      const path = 'settings';
      try {
        await setDoc(doc(db, path, 'global'), settings, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
        throw error;
      }
    },
    async getAllJobs() {
      const path = 'jobs';
      try {
        const q = query(collection(db, path), orderBy('created_at', 'desc'));
        const snapshot = await getDocs(q);
        return await Promise.all(snapshot.docs.map(async (d) => {
          const data = d.data() as Job;
          const clientDoc = await getDoc(doc(db, 'profiles', data.client_id));
          return {
            ...data,
            id: d.id,
            client: clientDoc.exists() ? clientDoc.data() : undefined
          };
        }));
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, path);
        return [];
      }
    },
    async getAllTickets() {
      const path = 'tickets';
      try {
        const snapshot = await getDocs(collection(db, path));
        return await Promise.all(snapshot.docs.map(async (d) => {
          const data = d.data() as Ticket;
          const userDoc = await getDoc(doc(db, 'profiles', data.userId));
          return {
            ...data,
            id: d.id,
            user: userDoc.exists() ? userDoc.data() as Profile : undefined
          };
        }));
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, path);
        return [];
      }
    },
    async replyToTicket(ticketId: string, message: string) {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');
      const path = `tickets/${ticketId}`;
      try {
        const ticketRef = doc(db, 'tickets', ticketId);
        const ticketSnap = await getDoc(ticketRef);
        if (!ticketSnap.exists()) throw new Error('Ticket not found');
        const replies = ticketSnap.data().replies || [];
        const newReply = {
          senderId: user.uid,
          message,
          created_at: new Date().toISOString()
        };
        await updateDoc(ticketRef, {
          replies: [...replies, newReply]
        });
        
        // Also notify user
        await api.notifications.create(
          ticketSnap.data().userId,
          'Support Response',
          'You have a new response on your support ticket.',
          'message'
        );
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    },
    async closeTicket(ticketId: string) {
      const path = `tickets/${ticketId}`;
      try {
        await updateDoc(doc(db, 'tickets', ticketId), { status: 'closed' });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    }
  },
  products: {
    async list(type?: ProductType) {
      const path = 'products';
      try {
        const constraints: QueryConstraint[] = [orderBy('created_at', 'desc')];
        if (type) {
          constraints.push(where('type', '==', type));
        }
        
        const q = query(collection(db, path), ...constraints);
        const snapshot = await getDocs(q);
        
        const products = await Promise.all(snapshot.docs.map(async (d) => {
          const data = d.data() as Product;
          // Hydrate creator profile
          const profileDoc = await getDoc(doc(db, 'profiles', data.creator_id));
          return {
            ...data,
            id: d.id,
            creator: profileDoc.exists() ? profileDoc.data() : undefined
          };
        }));
        
        return products;
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, path);
        return [];
      }
    },

    async get(id: string) {
      const path = `products/${id}`;
      try {
        const d = await getDoc(doc(db, 'products', id));
        if (!d.exists()) throw new Error('Product not found');
        const data = d.data() as Product;
        const profileDoc = await getDoc(doc(db, 'profiles', data.creator_id));
        return {
          ...data,
          id: d.id,
          creator: profileDoc.exists() ? profileDoc.data() : undefined
        } as Product;
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, path);
        throw error;
      }
    },

    async upload(
      product: Partial<Product>, 
      file: File | Blob | null, 
      screenshots: File[], 
      thumbnail?: File,
      onProgress?: (progress: UploadProgress) => void
    ) {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      // Check subscription limits
      const profile = await api.profiles.get(user.uid);
      if (profile) {
        const myProducts = await api.products.myProducts();
        const limit = profile.product_limit || 5; // Default free limit
        if (myProducts.length >= limit) {
          throw new Error(`Upload limit reached for ${profile.subscription_plan || 'free'} plan. Please upgrade to upload more.`);
        }
      }

      const progress: UploadProgress = {
        mainFile: 0,
        screenshots: screenshots.map(() => 0)
      };

      // Set initial progress
      onProgress?.({ ...progress });

      try {
        console.log('Starting product upload process...');
        
        // 1. Upload main file (optional if liveDemoUrl provided, but we handle it here if present)
        let fileUrlPromise: Promise<string> = Promise.resolve('');
        if (file) {
          const safeTitle = (product.title || 'asset').replace(/[^a-zA-Z0-9]/g, '_');
          const fileName = (file as File).name || `${safeTitle}_package.zip`;
          const storageFileName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          const fileRef = ref(storage, `products/files/${user.uid}/${storageFileName}`);
          
          const mainUploadTask = uploadBytesResumable(fileRef, file);
          fileUrlPromise = new Promise<string>((resolve, reject) => {
            mainUploadTask.on('state_changed', 
              (snapshot) => {
                const p = snapshot.totalBytes > 0 ? (snapshot.bytesTransferred / snapshot.totalBytes) * 100 : 0;
                progress.mainFile = p;
                onProgress?.({ ...progress });
              },
              (err) => {
                console.error('Main file upload error:', err);
                reject(err);
              },
              async () => {
                const url = await getDownloadURL(fileRef);
                resolve(url);
              }
            );
          });
        }

        // 2. Upload thumbnail if exists
        let thumbUrl = '';
        if (thumbnail) {
          const tName = `${Date.now()}-thumb-${thumbnail.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          const tRef = ref(storage, `products/images/${user.uid}/${tName}`);
          await uploadBytesResumable(tRef, thumbnail);
          thumbUrl = await getDownloadURL(tRef);
        }

        // 3. Upload screenshots
        const screenshotUrlsPromises = screenshots.map((s, index) => {
          const sName = `${Date.now()}-${s.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          const sRef = ref(storage, `products/images/${user.uid}/${sName}`);
          const sUploadTask = uploadBytesResumable(sRef, s);
          
          return new Promise<string>((resolve, reject) => {
            sUploadTask.on('state_changed',
              (snapshot) => {
                const p = snapshot.totalBytes > 0 ? (snapshot.bytesTransferred / snapshot.totalBytes) * 100 : 0;
                progress.screenshots[index] = p;
                onProgress?.({ ...progress });
              },
              (err) => {
                console.error(`Screenshot ${index} upload error:`, err);
                reject(err);
              },
              async () => {
                const url = await getDownloadURL(sRef);
                resolve(url);
              }
            );
          });
        });

        console.log(`Uploading main file and ${screenshots.length} screenshots...`);
        const [fileUrl, ...screenshotUrls] = await Promise.all([fileUrlPromise, ...screenshotUrlsPromises]);
        console.log('Uploads completed successfully. Saving to Firestore...');

        // 4. Save to DB
        const id = doc(collection(db, 'products')).id;
        const productData = {
          ...product,
          id,
          creator_id: user.uid,
          file_url: fileUrl,
          thumbnail_url: thumbUrl || screenshotUrls[0] || '',
          image_urls: screenshotUrls,
          status: 'Listed',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        await setDoc(doc(db, 'products', id), productData);
        console.log('Product saved successfully with ID:', id);
        return productData;
      } catch (error) {
        console.error('Final upload error:', error);
        handleFirestoreError(error, OperationType.WRITE, 'products');
        throw error;
      }
    },

    async myProducts() {
      const user = auth.currentUser;
      if (!user) return [];
      const path = 'products';
      try {
        const q = query(collection(db, path), where('creator_id', '==', user.uid));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, path);
        return [];
      }
    },

    async bulkArchive(ids: string[]) {
      try {
        await Promise.all(ids.map(id => 
          updateDoc(doc(db, 'products', id), { 
            status: 'Archived',
            updated_at: new Date().toISOString()
          })
        ));
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, 'products/bulk');
        throw error;
      }
    },

    async bulkDelete(ids: string[]) {
      try {
        await Promise.all(ids.map(id => 
          deleteDoc(doc(db, 'products', id))
        ));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'products/bulk');
        throw error;
      }
    }
  },

  files: {
    async upload(file: File, folder: string, onProgress?: (p: number) => void): Promise<string> {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const fileRef = ref(storage, `${folder}/${fileName}`);
      
      return new Promise((resolve, reject) => {
        const uploadTask = uploadBytesResumable(fileRef, file);
        uploadTask.on('state_changed', 
          (snapshot) => {
            const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            if (onProgress) onProgress(p);
          },
          reject,
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(url);
          }
        );
      });
    }
  },

  orders: {
    async create(productId: string, sellerId: string, amount: number, paymentMethod: 'upi' | 'crypto' | 'paypal' | 'bank' | 'card' | 'nowpayments', paymentProof: string) {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      const path = 'orders';
      try {
        const id = doc(collection(db, path)).id;
        const COMMISSION_RATE = 0.05;
        const commission = amount * COMMISSION_RATE;
        
        const orderData = {
          id,
          product_id: productId,
          buyer_id: user.uid,
          seller_id: sellerId,
          amount,
          commission,
          payment_method: paymentMethod,
          payment_proof: paymentProof,
          status: 'released', // Automatically release upon proof submission
          created_at: new Date().toISOString()
        };
        await setDoc(doc(db, path, id), orderData);
        
        // Notify Seller
        await api.notifications.create(
          sellerId,
          'New Order Received',
          `You have a new order for $${amount}. Payment proof has been submitted.`,
          'order'
        );

        return orderData;
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
        throw error;
      }
    },

    async updateStatus(orderId: string, status: 'released' | 'completed' | 'failed') {
      const path = `orders/${orderId}`;
      try {
        await updateDoc(doc(db, 'orders', orderId), { status });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
        throw error;
      }
    },

    async myOrders() {
      const user = auth.currentUser;
      if (!user) return [];

      const path = 'orders';
      try {
        const q = query(
          collection(db, path), 
          where('buyer_id', '==', user.uid),
          orderBy('created_at', 'desc')
        );
        const snapshot = await getDocs(q);
        
        const orders = await Promise.all(snapshot.docs.map(async (d) => {
          const data = d.data() as Order;
          const productDoc = await getDoc(doc(db, 'products', data.product_id));
          return {
            ...data,
            id: d.id,
            product: productDoc.exists() ? productDoc.data() as Product : undefined
          };
        }));
        
        return orders;
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, path);
        return [];
      }
    },

    async mySales() {
      const user = auth.currentUser;
      if (!user) return [];

      const path = 'orders';
      try {
        const q = query(
          collection(db, path), 
          where('seller_id', '==', user.uid),
          orderBy('created_at', 'desc')
        );
        const snapshot = await getDocs(q);
        
        const orders = await Promise.all(snapshot.docs.map(async (d) => {
          const data = d.data() as Order;
          const productDoc = await getDoc(doc(db, 'products', data.product_id));
          const buyerDoc = await getDoc(doc(db, 'profiles', data.buyer_id));
          return {
            ...data,
            id: d.id,
            product: productDoc.exists() ? productDoc.data() as Product : undefined,
            buyer: buyerDoc.exists() ? buyerDoc.data() as Profile : undefined
          };
        }));
        
        return orders;
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, path);
        return [];
      }
    }
  },
  
  reviews: {
    async create(productId: string, rating: number, comment: string) {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      const path = 'reviews';
      try {
        const id = doc(collection(db, path)).id;
        const reviewData = {
          id,
          product_id: productId,
          user_id: user.uid,
          rating,
          comment,
          created_at: new Date().toISOString()
        };
        await setDoc(doc(db, path, id), reviewData);
        return reviewData;
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
        throw error;
      }
    },

    async getByProductId(productId: string) {
      const path = 'reviews';
      try {
        const q = query(
          collection(db, path),
          where('product_id', '==', productId),
          orderBy('created_at', 'desc')
        );
        const snapshot = await getDocs(q);
        
        const reviews = await Promise.all(snapshot.docs.map(async (d) => {
          const data = d.data() as Review;
          const profileDoc = await getDoc(doc(db, 'profiles', data.user_id));
          return {
            ...data,
            id: d.id,
            user: profileDoc.exists() ? profileDoc.data() : undefined
          };
        }));
        
        return reviews;
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, path);
        return [];
      }
    },

    async hasReviewed(productId: string) {
      const user = auth.currentUser;
      if (!user) return false;

      const path = 'reviews';
      try {
        const q = query(
          collection(db, path),
          where('product_id', '==', productId),
          where('user_id', '==', user.uid),
          limit(1)
        );
        const snapshot = await getDocs(q);
        return !snapshot.empty;
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, path);
        return false;
      }
    }
  },

  profiles: {
    async get(id: string) {
      const d = await getDoc(doc(db, 'profiles', id));
      return d.exists() ? d.data() as Profile : null;
    },
    async update(profile: Partial<any>) {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      const path = `profiles/${user.uid}`;
      try {
        await setDoc(doc(db, 'profiles', user.uid), {
          ...profile,
          id: user.uid,
          email: user.email
        }, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    }
  },

  jobs: {
    async list() {
      const path = 'jobs';
      try {
        const q = query(collection(db, path), orderBy('created_at', 'desc'));
        const snapshot = await getDocs(q);
        return await Promise.all(snapshot.docs.map(async (d) => {
          const data = d.data();
          const profileDoc = await getDoc(doc(db, 'profiles', data.client_id));
          return {
            ...data,
            id: d.id,
            client: profileDoc.exists() ? profileDoc.data() : undefined
          };
        }));
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, path);
        return [];
      }
    },
    async create(job: Partial<any>) {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');
      
      const path = 'jobs';
      try {
        const id = doc(collection(db, path)).id;
        const jobData = {
          ...job,
          id,
          client_id: user.uid,
          status: 'open',
          created_at: new Date().toISOString()
        };
        await setDoc(doc(db, path, id), jobData);
        return jobData;
      } catch(error) {
        handleFirestoreError(error, OperationType.WRITE, path);
        throw error;
      }
    },
    async updateStatus(jobId: string, status: string) {
      const path = `jobs/${jobId}`;
      try {
        await updateDoc(doc(db, 'jobs', jobId), { status });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    },
    async getMyJobs() {
      const user = auth.currentUser;
      if (!user) return [];
      const path = 'jobs';
      try {
        const q = query(
          collection(db, path),
          where('client_id', '==', user.uid),
          orderBy('created_at', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ ...d.data(), id: d.id })) as Job[];
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, path);
        return [];
      }
    }
  },

  applications: {
    async create(jobId: string, clientId: string, fileUrl?: string) {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');
      
      const path = 'job_applications';
      try {
        const id = doc(collection(db, path)).id;
        const appData = {
          id,
          job_id: jobId,
          client_id: clientId,
          developer_id: user.uid,
          status: 'pending',
          file_url: fileUrl || null,
          created_at: new Date().toISOString()
        };
        await setDoc(doc(db, path, id), appData);
        return appData;
      } catch(error) {
        handleFirestoreError(error, OperationType.WRITE, path);
        throw error;
      }
    },
    async getMy(role: 'developer' | 'client') {
      const user = auth.currentUser;
      if (!user) return [];
      
      const path = 'job_applications';
      try {
        const q = query(
          collection(db, path),
          where(role === 'developer' ? 'developer_id' : 'client_id', '==', user.uid),
          orderBy('created_at', 'desc')
        );
        const snapshot = await getDocs(q);
        return await Promise.all(snapshot.docs.map(async (d) => {
          const data = d.data();
          const jobDoc = await getDoc(doc(db, 'jobs', data.job_id));
          const devDoc = await getDoc(doc(db, 'profiles', data.developer_id));
          const clientDoc = await getDoc(doc(db, 'profiles', data.client_id));
          return {
            ...data,
            id: d.id,
            job: jobDoc.exists() ? jobDoc.data() : undefined,
            developer: devDoc.exists() ? devDoc.data() : undefined,
            client: clientDoc.exists() ? clientDoc.data() : undefined,
          };
        }));
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, path);
        return [];
      }
    },
    async updateStatus(appId: string, status: string) {
      const path = `job_applications/${appId}`;
      try {
        await updateDoc(doc(db, 'job_applications', appId), { status });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    },
    async update(appId: string, data: any) {
      const path = `job_applications/${appId}`;
      try {
        await updateDoc(doc(db, 'job_applications', appId), data);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    }
  },

  jobMessages: {
    async send(applicationId: string, text: string) {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');
      
      const path = 'messages';
      try {
        const id = doc(collection(db, path)).id;
        const msgData = {
          id,
          application_id: applicationId,
          sender_id: user.uid,
          text,
          created_at: new Date().toISOString()
        };
        await setDoc(doc(db, path, id), msgData);
        return msgData;
      } catch(error) {
        handleFirestoreError(error, OperationType.WRITE, path);
        throw error;
      }
    },
    async list(applicationId: string) {
      const path = 'messages';
      try {
        const q = query(
          collection(db, path),
          where('application_id', '==', applicationId),
          orderBy('created_at', 'asc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => d.data());
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, path);
        return [];
      }
    }
  },
  
  withdrawals: {
    async getMy() {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      const path = 'withdrawals';
      try {
        const q = query(collection(db, path), where('user_id', '==', user.uid), orderBy('created_at', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, path);
        return [];
      }
    },
    async create(withdrawal: Partial<any>) {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');
      
      const path = 'withdrawals';
      try {
        const id = doc(collection(db, path)).id;
        const withdrawalData = {
          ...withdrawal,
          id,
          user_id: user.uid,
          status: 'pending',
          created_at: new Date().toISOString()
        };
        await setDoc(doc(db, path, id), withdrawalData);
        return withdrawalData;
      } catch(error) {
        handleFirestoreError(error, OperationType.WRITE, path);
        throw error;
      }
    }
  },

  notifications: {
    async list() {
      const user = auth.currentUser;
      if (!user) return [];
      const path = 'notifications';
      try {
        const q = query(
          collection(db, path),
          where('userId', '==', user.uid),
          orderBy('created_at', 'desc'),
          limit(20)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as AppNotification[];
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, path);
        return [];
      }
    },
    async markRead(id: string) {
      const path = `notifications/${id}`;
      try {
        await updateDoc(doc(db, 'notifications', id), { read: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    },
    async create(userId: string, title: string, message: string, type: 'order' | 'payment' | 'payout' | 'system' | 'message' | 'announcement') {
      const path = 'notifications';
      try {
        const id = doc(collection(db, path)).id;
        await setDoc(doc(db, path, id), {
          id,
          userId,
          title,
          message,
          type,
          read: false,
          created_at: new Date().toISOString()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    }
  },

  tickets: {
    async create(subject: string, message: string, category: Ticket['category'] = 'support', attachmentUrl?: string) {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');
      const path = 'tickets';
      try {
        const id = doc(collection(db, path)).id;
        const ticketData: Ticket = {
          id,
          userId: user.uid,
          subject,
          message,
          category,
          attachment_url: attachmentUrl || null,
          status: 'open' as const,
          created_at: new Date().toISOString(),
          replies: []
        };
        await setDoc(doc(db, path, id), ticketData);
        return ticketData;
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
        throw error;
      }
    },
    async listMy() {
      const user = auth.currentUser;
      if (!user) return [];
      const path = 'tickets';
      try {
        const q = query(
          collection(db, path),
          where('userId', '==', user.uid),
          orderBy('created_at', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Ticket[];
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, path);
        return [];
      }
    }
  },

  conversations: {
    async getOrCreate(productId: string, sellerId: string) {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');
      if (user.uid === sellerId) throw new Error('Cannot message yourself');

      const path = 'conversations';
      try {
        const q = query(
          collection(db, path),
          where('participants', 'array-contains', user.uid)
        );
        const snapshot = await getDocs(q);
        const existingConversation = snapshot.docs.find(d => {
          const data = d.data();
          return data.participants.includes(sellerId) && data.product_id === productId;
        });

        if (existingConversation) return { id: existingConversation.id, ...existingConversation.data() } as Conversation;

        const id = doc(collection(db, path)).id;
        const conversationData = {
          id,
          participants: [user.uid, sellerId],
          product_id: productId,
          created_at: new Date().toISOString(),
          last_message_at: new Date().toISOString()
        };
        await setDoc(doc(db, path, id), conversationData);
        return conversationData as Conversation;
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, path);
        throw error;
      }
    },
    async list() {
      const user = auth.currentUser;
      if (!user) return [];
      const path = 'conversations';
      try {
        const q = query(
          collection(db, path),
          where('participants', 'array-contains', user.uid),
          orderBy('last_message_at', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Conversation[];
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, path);
        return [];
      }
    }
  },

  messages: {
    async getByConversationId(conversationId: string) {
      const path = 'messages';
      try {
        const q = query(
          collection(db, path),
          where('conversation_id', '==', conversationId),
          orderBy('created_at', 'asc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => d.data());
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, path);
        return [];
      }
    },
    async send(conversationId: string, text: string, fileUrl?: string) {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');
      
      const path = 'messages';
      try {
        const id = doc(collection(db, path)).id;
        const msgData = {
          id,
          conversation_id: conversationId,
          sender_id: user.uid,
          text,
          file_url: fileUrl || null,
          created_at: new Date().toISOString()
        };
        await setDoc(doc(db, path, id), msgData);
        
        await updateDoc(doc(db, 'conversations', conversationId), {
          last_message: text,
          last_message_at: msgData.created_at
        });
        
        return msgData;
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
        throw error;
      }
    }
  },

  subscriptions: {
    async upgrade(plan: SubscriptionPlan) {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');
      
      const limits = {
        free: 5,
        pro: 50,
        premium: 9999
      };

      await api.profiles.update({
        subscription_plan: plan,
        product_limit: limits[plan],
        verification_badge: plan === 'premium'
      });
    }
  }
};
