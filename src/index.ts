import {
    Connection,
    PublicKey,
    Keypair,
    LAMPORTS_PER_SOL,
    Transaction,
    SystemProgram,
    sendAndConfirmTransaction
} from '@solana/web3.js';
import prompt from 'prompt-sync';
import bs58 from 'bs58';
import fs from 'fs';

const connection = new Connection('https://devnet.sonic.game', 'confirmed');
const input = prompt();

async function getBalance(publicKeyString: string): Promise<number> {
    const publicKey = new PublicKey(publicKeyString);
    const balance = await connection.getBalance(publicKey);
    return balance / LAMPORTS_PER_SOL; // Convert lamports to SOL
}

async function generateRandomKeypair(): Promise<Keypair> {
    return Keypair.generate();
}

async function sendFromMultipleSenders(senderPrivateKeys: string[], recipientPublicKeyString: string, amountInSol: number, isRandomAddress: boolean) {
    const recipientPublicKey = new PublicKey(recipientPublicKeyString);
    const amountInLamports = amountInSol * LAMPORTS_PER_SOL;

    
    for (const senderPrivateKey of senderPrivateKeys) {
        // Decode the Base58 private key
        const secretKey = bs58.decode(senderPrivateKey);

        // Ensure the decoded key is 64 bytes long
        if (secretKey.length !== 64) {
            console.error(`Invalid secret key length for key: ${senderPrivateKey}`);
            continue;
        }

        const senderKeypair = Keypair.fromSecretKey(secretKey);

        
        
        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: senderKeypair.publicKey,
                toPubkey: recipientPublicKey,
                lamports: amountInLamports,
            })
        );
        

        const randomReceipt = await generateRandomKeypair();
        const randomTransaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: senderKeypair.publicKey,
                toPubkey: randomReceipt.publicKey,
                lamports: amountInLamports,
            })
        );

        try {
            const signature = await sendAndConfirmTransaction(
                connection,
               isRandomAddress == true ? randomTransaction : transaction,
                [senderKeypair]
            );
            console.log(`Transaction successful with signature: ${signature}`);
        } catch (error) {
            console.error(`Transaction failed for sender ${senderKeypair.publicKey.toBase58()}:`, error);
        }
    }
}

async function main() {
    console.log("Solana Auto Sender");
    console.log("Enter number to call function");
    console.log("1. Get Balance");
    console.log("2. Multisend");

    const choice = input("Masukan pilihan: ");

    switch (choice) {
        case '1':
            const publicKey = input("Masukan address: ");
            const balance = await getBalance(publicKey);
            console.log(`Balance for ${publicKey}: ${balance} SOL`);
            break;
        case '2':
            const senderPrivateKeys = [
                input("Masukan private key: "),
            ];

            const amount = parseFloat(input("Masukan jumlah SOL: "));

            console.log("")
            console.log("Pilih Jenis Transaksi")
            console.log("1. Ke address.txt")
            console.log("2. Ke Random Address")
            const isRandom =  input("Masukan pilihan : ")
            const recipientPublicKey = fs.readFileSync('address.txt', 'utf-8').trim().split('\n');;

            if(isRandom == "1") {
                 // Read recipient public key from address.txt
           

            for (const address of recipientPublicKey) {
                await sendFromMultipleSenders(senderPrivateKeys, address, amount, false);
            }
            } else {
                
                const inputStr =  input("Masukan jumlah transaksi : ")
                const txCount = parseInt(inputStr);
                if (!isNaN(txCount)) { // Check if txCount is a valid number
                    for (let i = 0; i < txCount; i++) {
                        await sendFromMultipleSenders(senderPrivateKeys, "7m937A6oQvaX37DjaBLCbxsU7eGcqr2NSEEExvjBACkm", amount, true)
                        // Your code logic for each iteration goes here
                    }
                } else {
                    console.log("Invalid input. Masukan nomor yang valid.");
                }

                
             
            }
            

           

            
            break;
        default:
            console.log("Invalid choice");
            break;
    }
}

main().catch(err => {
    console.error(err);
});
