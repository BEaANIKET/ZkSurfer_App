'use client';
import { FC, useState, useEffect, useRef } from 'react';
import { BiMenuAltLeft, BiMenuAltRight } from 'react-icons/bi';
import { BsArrowReturnLeft } from 'react-icons/bs';
import { FaPen } from 'react-icons/fa';
import { HiDotsVertical } from 'react-icons/hi';
import Image from 'next/image';
import createNft from '../../component/MintNFT';
import { useWallet } from '@solana/wallet-adapter-react';
import { useSession } from 'next-auth/react';
import ResultBlock from '@/component/ui/ResultBlock';
import * as pdfjs from 'pdfjs-dist';
import { useRouter } from 'next/navigation';
// import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { useMemeStore } from '@/stores/meme-store';
import { ApifyClient } from 'apify-client';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { IoMdClose } from "react-icons/io";
import TweetPanel from '@/component/ui/TweetPanel';
import CommandPopup from '@/component/ui/CommandPopup';
import { ReactNode } from 'react';
import { useTickerStore } from '@/stores/ticker-store';
import TickerSelector from '@/component/ui/TickerSelector';
import React from 'react';
import { useTwitterStore } from '@/stores/twitter-store';
import TokenSetup from '@/component/ui/TokenSetup';
import GeneratedTweetsTable from '@/component/ui/GenerateTweetTable';
import TweetTable from '@/component/ui/TweetTable';
import CharacterGenForm from '@/component/ui/CharecterGen';
import { TokenCreator } from '../memelaunch/tokenCreator';
import { CustomWalletButton } from '@/component/ui/CustomWalletButton';


interface GeneratedTweet {
    tweet: string;
    id?: number;
}

//type Command = 'image-gen' | 'meme-coin' | 'content';
type Command = 'image-gen' | 'meme-coin' | 'content' | 'select' | 'post' | 'tokens' | 'tweet' | 'tweets' | 'generate-tweet' | 'generate-tweet-image' | 'generate-tweet-images' | 'save' | 'saves' | 'character-gen' | 'launch';

interface TickerPopupProps {
    tickers: string[];
    onSelect: (ticker: string) => void;
}

// interface CommandPopupProps {
//     onSelect: (command: Command, option?: string) => void;
// }


interface TickerOption {
    name: string;
}

interface CommandPopupProps {
    onSelect: (command: Command) => void;
}

interface TickerInfo {
    name: string;
    info: any; // Response from contentengine_knowledgebase API
}

interface FileSystemFileHandle {
    createWritable(): Promise<FileSystemWritableFileStream>;
}

interface FileSystemWritableFileStream {
    write(data: any): Promise<void>;
    close(): Promise<void>;
}

interface ShowSaveFilePickerOptions {
    suggestedName?: string;
    types?: Array<{
        description: string;
        accept: Record<string, string[]>;
    }>;
}

// Extend the window interface
declare global {
    interface Window {
        showSaveFilePicker?: (options?: ShowSaveFilePickerOptions) => Promise<FileSystemFileHandle>;
    }
}

interface FileObject {
    file: File;
    preview: string;
    isPdf: boolean;
}

interface Message {
    role: 'user' | 'assistant';
    content: string | ReactNode | Array<{
        type: 'text' | 'image_url';
        text?: string;
        image_url?: { url: string };
    }>;
    type?: 'text' | 'image' | 'image_url' | 'command';
    proof?: any;
    command?: string;
    seed?: string;
}



// const CommandPopup: React.FC<CommandPopupProps> = ({ onSelect }) => (
//     <div className="absolute bottom-full left-0 bg-[#171D3D] rounded-lg shadow-lg">
//         <button onClick={() => onSelect('image-gen')} className="block w-full text-left px-4 py-2 hover:bg-[#24284E]">
//             /image-gen
//         </button>
//         <button onClick={() => onSelect('meme-coin')} className="block w-full text-left px-4 py-2 hover:bg-[#24284E]">
//             /meme-coin
//         </button>
//         <button onClick={() => onSelect('content')} className="block w-full text-left px-4 py-2 hover:bg-[#24284E]">
//             /content
//         </button>
//     </div>
// );


const TickerPopup: React.FC<TickerPopupProps> = ({ tickers, onSelect }) => (
    <div className="absolute bottom-full left-0 bg-[#171D3D] rounded-lg shadow-lg">
        {tickers.map((ticker, index) => (
            <button
                key={index}
                onClick={() => onSelect(ticker)}
                className="block w-full text-left px-4 py-2 hover:bg-[#24284E]"
            >
                {ticker}
            </button>
        ))}
    </div>
);



const HomeContent: FC = () => {
    const wallet = useWallet();
    const { data: session, status } = useSession();
    const [files, setFiles] = useState<FileObject[]>([]);
    const [fileInput, setFileInput] = useState<File | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    const [proofData, setProofData] = useState(null);
    const [resultType, setResultType] = useState('');
    const [pdfContent, setPdfContent] = useState<string | null>(null);
    const [currentPdfName, setCurrentPdfName] = useState<string | null>(null);
    const [showCommandPopup, setShowCommandPopup] = useState(false);
    const [commandPart, setCommandPart] = useState('');
    const [normalPart, setNormalPart] = useState('');
    // const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const [currentCommand, setCurrentCommand] = useState<'image-gen' | 'meme-coin' | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [activeNavbarTicker, setActiveNavbarTicker] = useState<string | null>(null);
    const [selectedCoinId, setSelectedCoinId] = useState<string | null>(null);

    const inputRef = useRef<HTMLTextAreaElement>(null);

    const [launchMode, setLaunchMode] = useState<boolean>(false);
    const [launchCoins, setLaunchCoins] = useState<any[]>([]);



    // const [showTickerTable, setShowTickerTable] = useState(false);
    const { setAvailableTickers, setSelectedMemeTicker, availableTickers } = useTickerStore();

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    // const [tickerInfoMap, setTickerInfoMap] = useState<Map<string, any>>(new Map());
    // const [selectedTicker, setSelectedTicker] = useState<string | null>(null);

    const [showTweetPanel, setShowTweetPanel] = useState(false);
    // const [generatedTweets, setGeneratedTweets] = useState<{ tweet: any }[]>([]);
    const [generatedTweets, setGeneratedTweets] = useState<GeneratedTweet[]>([]);
    const [lastSavedCommand, setLastSavedCommand] = useState<string>('');

    // const { address } = useAccount();
    // const { data: walletClient } = useWalletClient();
    // const publicClient = usePublicClient();

    const [displayMessages, setDisplayMessages] = useState<Message[]>([]); // Array for messages to be displayed
    const [apiMessages, setApiMessages] = useState<Message[]>([]);

    const [currentSeed, setCurrentSeed] = useState<string | null>(null);
    const [tickerOptions, setTickerOptions] = useState<TickerOption[]>([]);
    const [showTickerPicker, setShowTickerPicker] = useState(false);
    const [showTickerPopup, setShowTickerPopup] = useState(false);
    const [tickers, setTickers] = useState<string[]>([]);

    const [tweets, setTweets] = useState([]);
    const [filteredCoins, setFilteredCoins] = useState([]);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [displayMessages, isLoading]);


    const [memeGenerationData, setMemeGenerationData] = useState<{
        name: string;
        description: string;
        prompt: string;
        base64Image: string;
        seed: number;
    } | null>(null);

    // useEffect(() => {
    //     const fetchTickerOptions = async () => {
    //         if (wallet.publicKey) {
    //             try {
    //                 const response = await fetch(`https://zynapse.zkagi.ai/getTickersByWallet/${wallet.publicKey.toString()}`, {
    //                     headers: {
    //                         'api-key': 'zk-123321'
    //                     }
    //                 });
    //                 if (!response.ok) throw new Error('Failed to fetch tickers');
    //                 const data = await response.json();
    //                 setTickers(data.tickers); // Only set the tickers array
    //             } catch (error) {
    //                 console.error('Error fetching tickers:', error);
    //             }
    //         }
    //     };

    //     fetchTickerOptions();
    // }, [wallet.publicKey]);

    useEffect(() => {
        const fetchTickersAndInfo = async () => {
            if (wallet.publicKey) {
                try {
                    // 1. Fetch tickers
                    const response = await fetch(
                        `https://zynapse.zkagi.ai/getTickersByWallet/${wallet.publicKey.toString()}`,
                        {
                            headers: {
                                'api-key': 'zk-123321'
                            }
                        }
                    );
                    if (!response.ok) throw new Error('Failed to fetch tickers');
                    const data = await response.json();
                    console.log('data', data)
                    setTickers(data.tickers);
                    setAvailableTickers(data.tickers);
                    console.log('Updated availableTickers:', useTickerStore.getState().availableTickers);

                    // 2. Fetch info for each ticker
                    // const infoMap = new Map();
                    // for (const ticker of data.tickers) {
                    //     const infoResponse = await fetch(
                    //         `https://zynapse.zkagi.ai/contentengine_knowledgebase/${ticker}`,
                    //         {
                    //             headers: {
                    //                 'api-key': 'zk-123321'
                    //             }
                    //         }
                    //     );
                    //     if (infoResponse.ok) {
                    //         const tickerInfo = await infoResponse.json();
                    //         infoMap.set(ticker, tickerInfo);
                    //     }
                    // }
                    // setTickerInfoMap(infoMap);
                } catch (error) {
                    console.error('Error fetching tickers and info:', error);
                }
            }
        };

        fetchTickersAndInfo();
    }, [wallet.publicKey, setTickers, setAvailableTickers]);

    const compressImage = async (base64String: string, targetSizeKB: number = 450): Promise<string> => {
        // Create an image element
        const img = new window.Image();
        await new Promise((resolve) => {
            img.onload = resolve;
            img.src = base64String;
        });

        const canvas = document.createElement('canvas');
        let ctx = canvas.getContext('2d');
        let quality = 1.0;
        let compressed = base64String;

        // Start with original dimensions
        canvas.width = img.width;
        canvas.height = img.height;

        // Function to get file size in KB
        const getFileSizeKB = (base64String: string): number => {
            const base64Length = base64String.split(',')[1].length;
            const fileSizeBytes = (base64Length * 3) / 4;
            return fileSizeBytes / 1024;
        };

        // Compress until size is under target
        while (getFileSizeKB(compressed) > targetSizeKB && quality > 0.1) {
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                compressed = canvas.toDataURL('image/jpeg', quality);
            }
            quality -= 0.1;
        }

        // If still too large, reduce dimensions
        if (getFileSizeKB(compressed) > targetSizeKB) {
            let scale = 0.9;
            while (getFileSizeKB(compressed) > targetSizeKB && scale > 0.1) {
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                if (ctx) {
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    compressed = canvas.toDataURL('image/jpeg', quality);
                }
                scale -= 0.1;
            }
        }

        return compressed;
    };


    const processTwitterData = async (twitterUrl: string) => {
        const client = new ApifyClient({
            token: 'apify_api_mdt6tlhZErHAe9WPbgUGhYGfeFugLd17oXzO',
        });

        try {
            const input = {
                handles: [twitterUrl],
                tweetsDesired: 10,
                proxyConfig: { useApifyProxy: true },
            };

            // Start the actor run
            const run = await client.actor("quacker/twitter-scraper").call(input);

            // Wait for the run to finish
            await client.run(run.id).waitForFinish();

            // Get the output from the dataset
            const { items } = await client.dataset(run.defaultDatasetId).listItems();

            // Extract only the full_text from each tweet item
            const tweetTexts = items.map(item => item.full_text);

            return tweetTexts;
        } catch (error) {
            console.error('Error fetching tweets:', error);
            return null;
        }
    };




    // Function to format base64 image properly
    const formatBase64Image = (base64String: string): string => {
        if (!base64String.startsWith('data:image/')) {
            return `data:image/png;base64,${base64String}`;
        }
        return base64String;
    };

    const handleMemeImageGeneration = async (imageData: string, prompt: string) => {
        try {
            // Format and compress the image here instead of in the message handling
            let formattedImage = imageData;
            if (!imageData.startsWith('data:image/')) {
                formattedImage = `data:image/png;base64,${imageData}`;
            }
            const compressedImage = await compressImage(formattedImage);

            const imageUploadResponse = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [{
                        role: 'user',
                        content: [{
                            type: 'text',
                            text: 'Analyze the given image and suggest a creative name and description that fit the theme and appearance of the image. Ensure the output is always in the format: {"name":<generated_name>, "description":<generated_description>}.Return only a JSON response in the following format: {"name":<generated_name>, "description":<generated_description>}.'
                        }, {
                            type: 'image_url',
                            image_url: {
                                url: compressedImage
                            }
                        }]
                    }]
                })
            });

            if (!imageUploadResponse.ok) {
                throw new Error('Failed to process image');
            }

            const data = await imageUploadResponse.json();

            try {
                // const jsonMatch = data.content.match(/\{.*\}/);
                const jsonMatch = data.content.match(/```json\n({[\s\S]*?})\n```/);
                console.log('jsonMatch', jsonMatch)
                console.log('jsonMatch[0]', jsonMatch[1])
                if (jsonMatch && jsonMatch[0]) {
                    const parsedData = JSON.parse(jsonMatch[1]);
                    console.log('parsedData', parsedData)
                    setMemeGenerationData({
                        ...parsedData,
                        prompt,
                        base64Image: compressedImage,
                        seed: data.proof?.seed || -1
                    });
                } else {
                    throw new Error('No JSON object found in response');
                }
            } catch (e) {
                console.error('Failed to parse meme data:', e);
            }
        } catch (error) {
            console.error('Error in meme image generation:', error);
        }
    };

    useEffect(() => {
        const handleMarketClick = () => {
            router.push('/marketplace');
        };

        // Attach the handler to your marketplace button
        const marketplaceButton = document.querySelector('[data-marketplace-button]');
        if (marketplaceButton) {
            marketplaceButton.addEventListener('click', handleMarketClick);
        }

        return () => {
            if (marketplaceButton) {
                marketplaceButton.removeEventListener('click', handleMarketClick);
            }
        };
    }, [router]);

    // const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    //     const value = e.target.value;
    //     setInputMessage(value);

    //     if (value === '/') {
    //         setShowCommandPopup(true);
    //         setShowTickerPopup(false);
    //     } else if (!value) {
    //         setShowCommandPopup(false);
    //         setShowTickerPopup(false);
    //     }
    // };

    // const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    //     if (e.key === 'Escape') {
    //         setShowCommandPopup(false);
    //     }
    // };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setInputMessage(value);

        if (value === '/') {
            setShowCommandPopup(true);
            setShowTickerPopup(false);
        } else if (!value) {
            setShowCommandPopup(false);
            setShowTickerPopup(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Escape') {
            setShowCommandPopup(false);
        }
    };



    const getStyledInputContent = () => {
        const parts = inputMessage.split(' ');
        if (parts[0].startsWith('/')) {
            return (
                <>
                    <span className="text-blue-400 font-bold">{parts[0]}</span>
                    <span>{' ' + parts.slice(1).join(' ')}</span>
                </>
            );
        }
        return inputMessage;
    };

    // const handleCommandSelect = (command: Command) => {
    //     if (command === 'content') {
    //         setInputMessage('/content ');
    //         setShowCommandPopup(false);
    //         setShowTickerPopup(true);
    //     } else {
    //         setInputMessage(`/${command} `);
    //         setShowCommandPopup(false);
    //     }
    //     inputRef.current?.focus();
    // };


    // In your HomeContent component:
    // const handleCommandSelect = (command: Command) => {
    //     setInputMessage(`/${command} `);
    //     setShowCommandPopup(false);
    //     inputRef.current?.focus();
    // };

    // const handleCommandSelect = (command: Command) => {
    //     if (command === 'select') {
    //         setShowTickerTable(true);
    //         setInputMessage(`/${command} `);
    //     } else {
    //         setInputMessage(`/${command} `);
    //     }
    //     setShowCommandPopup(false);
    //     inputRef.current?.focus();
    // };

    const handleCommandSelect = (command: Command) => {
        if (command === 'select') {
            setInputMessage(`/${command} `)
            const displayMessage: Message = {
                role: 'assistant',
                content: <TickerSelector /> as ReactNode,
            };
            setDisplayMessages(prev => [...prev, displayMessage]);
            setShowCommandPopup(false);
        } else {
            setInputMessage(`/${command} `);
            setShowCommandPopup(false);
        }
        inputRef.current?.focus();
    };

    const handleTickerClick = (ticker: string) => {
        setActiveNavbarTicker(prevTicker => prevTicker === ticker ? null : ticker);
    };

    // const handleCommandSelect = (command: Command) => {
    //     if (command === 'select' || command === 'launch') {
    //         setInputMessage(`/${command} `)
    //         const displayMessage: Message = {
    //             role: 'assistant',
    //             content: <TickerSelector /> as ReactNode,
    //         };
    //         setDisplayMessages(prev => [...prev, displayMessage]);
    //         setShowCommandPopup(false);
    //     } else {
    //         setInputMessage(`/${command} `);
    //         setShowCommandPopup(false);
    //     }
    //     inputRef.current?.focus();
    // };



    // const handleTickerSelect = (ticker: string) => {
    //     setSelectedTicker(ticker);
    //     setInputMessage(`/content ${ticker}`);
    //     setShowTickerPopup(false);
    //     inputRef.current?.focus();
    // };

    const handleTickerSelect = async (ticker: string) => {
        // Set the active navbar ticker when selecting from dropdown
        setSelectedMemeTicker(ticker);
        setActiveNavbarTicker(ticker);

        const currentTickerInfo = useTickerStore.getState().tickerInfo[ticker];
        if (!currentTickerInfo) {
            try {
                const infoResponse = await fetch(
                    `https://zynapse.zkagi.ai/contentengine_knowledgebase/${ticker}`,
                    {
                        headers: {
                            'api-key': 'zk-123321'
                        }
                    }
                );

                if (infoResponse.ok) {
                    const tickerInfo = await infoResponse.json();
                    useTickerStore.getState().setTickerInfo(ticker, tickerInfo);
                } else {
                    console.error('Failed to fetch ticker info:', ticker);
                }
            } catch (error) {
                console.error('Error fetching ticker info:', error);
            }
        }

        // Only set the input message if it's a direct /content command
        if (inputMessage.startsWith('/content')) {
            setInputMessage(`/content ${ticker}`);
        }
        setShowTickerPopup(false);
        inputRef.current?.focus();
    };



    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (session && session.user) {
            setUserEmail('User');
        }
    }, [session]);

    useEffect(() => {
        pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`
    }, []);

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);


    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                if (typeof reader.result === 'string') {
                    resolve(reader.result);
                } else {
                    reject(new Error('Failed to convert file to base64'));
                }
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const extractTextFromPdf = async (file: File): Promise<string> => {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

        const textPromises = Array.from({ length: pdf.numPages }, async (_, i) => {
            const page = await pdf.getPage(i + 1);
            const content = await page.getTextContent();
            return content.items.map((item: any) => item.str).join(' ');
        });

        const texts = await Promise.all(textPromises);
        return texts.join('\n');
    };


    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const selectedFiles = Array.from(e.target.files);
            if (files.length + selectedFiles.length <= 4) {
                const newFiles = await Promise.all(
                    selectedFiles.map(async (file) => {
                        if (file.type === 'application/pdf') {
                            const pdfText = await extractTextFromPdf(file);
                            setPdfContent(pdfText);
                            setCurrentPdfName(file.name);
                            return {
                                file,
                                preview: URL.createObjectURL(file),
                                isPdf: true,
                            };
                        } else {
                            return {
                                file,
                                preview: await fileToBase64(file),
                                isPdf: false,
                            };
                        }
                    })
                );
                setFiles([...files, ...newFiles]);
            } else {
                alert('You can only upload up to 4 files');
            }
        }
    };

    const removeFile = (index: number) => {
        const newFiles = [...files];
        URL.revokeObjectURL(newFiles[index].preview);
        newFiles.splice(index, 1);
        setFiles(newFiles);
    };

    const handleTweetCommand = async (message: string) => {
        const { selectedTicker } = useTickerStore.getState();

        if (!selectedTicker) {
            const errorMessage: Message = {
                role: 'assistant',
                content: 'No ticker selected. Please use /select command first to choose a ticker.',
                type: 'text'
            };
            setDisplayMessages(prev => [...prev, errorMessage]);
            return;
        }

        try {
            // Fetch saved tweets for the selected ticker
            const response = await fetch(`https://zynapse.zkagi.ai/contentengine_gettweets/${selectedTicker}`, {
                headers: {
                    'Accept': '/',
                    'api-key': 'zk-123321'
                }
            });

            if (!response.ok) throw new Error('Failed to fetch tweets');
            const data = await response.json();

            // If it's a single tweet command
            if (message.startsWith('/tweet ')) {
                const tweetId = parseInt(message.replace('/tweet ', '').trim());
                const selectedTweet = data.tweets.find((t: any, index: number) => index + 1 === tweetId);

                if (!selectedTweet) {
                    throw new Error(`Tweet with ID ${tweetId} not found`);
                }

                await postTweet(selectedTweet.tweet_text);

                const successMessage: Message = {
                    role: 'assistant',
                    content: `Successfully posted tweet #${tweetId}`,
                    type: 'text'
                };
                setDisplayMessages(prev => [...prev, successMessage]);
            }
            // If it's a multiple tweets command
            else if (message.startsWith('/tweets ')) {
                const tweetIds = message
                    .replace('/tweets ', '')
                    .trim()
                    .split(',')
                    .map(id => parseInt(id.trim()));

                const selectedTweets = tweetIds.map(id => {
                    const tweet = data.tweets[id - 1];
                    if (!tweet) throw new Error(`Tweet with ID ${id} not found`);
                    return tweet.tweet_text;
                });

                for (const tweetText of selectedTweets) {
                    await postTweet(tweetText);
                }

                const successMessage: Message = {
                    role: 'assistant',
                    content: `Successfully posted tweets: ${tweetIds.join(', ')}`,
                    type: 'text'
                };
                setDisplayMessages(prev => [...prev, successMessage]);
            }
            // Display available tweets
            else {
                const tweetList = data.tweets.map((tweet: any, index: number) =>
                    `${index + 1}. ${tweet.tweet_text}`
                ).join('\n');

                // const displayMessage: Message = {
                //     role: 'assistant',
                //     content: `Available tweets for ${selectedTicker}:\n\n${tweetList}\n\nUse /tweet [id] to post a single tweet or /tweets [id1,id2,id3] to post multiple tweets.`,
                //     type: 'text'
                // };
                const tweets = data.tweets.map((tweet: any, index: number) => ({
                    id: index + 1,
                    tweet_text: tweet.tweet_text
                }));

                const displayMessage: Message = {
                    role: 'assistant',
                    content: <TweetTable tweets={tweets} ticker={selectedTicker} />,
                    type: 'text'
                };

                setDisplayMessages(prev => [...prev, displayMessage]);
            }
        } catch (error) {
            const errorMessage: Message = {
                role: 'assistant',
                content: `Error: ${error instanceof Error ? error.message : 'Failed to process tweet command'}`,
                type: 'text'
            };
            setDisplayMessages(prev => [...prev, errorMessage]);
        }
    };

    // Add this to your postTweet function
    const postTweet = async (text: string) => {
        const apiKey = 'BGwmxuKTPgFsTocz01bHeuMtP';
        const apiSecretKey = 'QX2uE79GiP4qKsmoRHh3pWuEtjmsHRoUIpPl6lM14P0sM8vVNE';
        const { accessToken, accessSecret } = useTwitterStore.getState();

        if (!accessToken || !accessSecret) {
            throw new Error('Twitter credentials not set. Please use /token command first.');
        }

        const url = `http://65.20.68.31:4040/tweet/?api_key=${apiKey}&api_secret_key=${apiSecretKey}&access_token=${accessToken}&access_token_secret=${accessSecret}&text=${encodeURIComponent(text)}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Error posting tweet: ${response.statusText}`);
        }

        return await response.json();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const fullMessage = inputMessage.trim();

        // Command handling for /select
        // if (fullMessage.startsWith('/select')) {
        //     const numberStr = fullMessage.replace('/select', '').trim();
        //     const selectedIndex = parseInt(numberStr) - 1;

        //     if (!isNaN(selectedIndex) && selectedIndex >= 0 && selectedIndex < tickers.length) {
        //         const selectedTicker = tickers[selectedIndex];
        //         setSelectedMemeTicker(selectedTicker);
        //         setActiveNavbarTicker(selectedTicker);
        //         setInputMessage('');

        //         // Add a system message to show the selection
        //         const systemMessage: Message = {
        //             role: 'assistant',
        //             content: `Selected ticker: ${selectedTicker}`,
        //             type: 'text'
        //         };
        //         setDisplayMessages(prev => [...prev, systemMessage]);
        //     } else {
        //         // Show error message for invalid selection
        //         const errorMessage: Message = {
        //             role: 'assistant',
        //             content: 'Invalid ticker selection. Please choose a valid number.',
        //             type: 'text'
        //         };
        //         setDisplayMessages(prev => [...prev, errorMessage]);
        //     }
        //     return; // Don't proceed with API call
        // }
        if (fullMessage.startsWith('/select')) {
            const numberStr = fullMessage.replace('/select', '').trim();
            const selectedIndex = parseInt(numberStr) - 1;

            if (!isNaN(selectedIndex) && selectedIndex >= 0 && selectedIndex < tickers.length) {
                const selectedTicker = tickers[selectedIndex];

                try {
                    // Fetch ticker info
                    const infoResponse = await fetch(
                        `https://zynapse.zkagi.ai/contentengine_knowledgebase/${selectedTicker}`,
                        {
                            headers: {
                                'api-key': 'zk-123321'
                            }
                        }
                    );

                    if (infoResponse.ok) {
                        const tickerInfo = await infoResponse.json();
                        useTickerStore.getState().setTickerInfo(selectedTicker, tickerInfo);
                    }

                    // Update selected ticker in store
                    setSelectedMemeTicker(selectedTicker);
                    setActiveNavbarTicker(selectedTicker);
                    setInputMessage('');

                    // Add a system message to show the selection
                    const systemMessage: Message = {
                        role: 'assistant',
                        content: `Selected ticker: ${selectedTicker}`,
                        type: 'text'
                    };
                    setDisplayMessages(prev => [...prev, systemMessage]);
                } catch (error) {
                    console.error('Error fetching ticker info:', error);
                    const errorMessage: Message = {
                        role: 'assistant',
                        content: 'Error fetching ticker information. Please try again.',
                        type: 'text'
                    };
                    setDisplayMessages(prev => [...prev, errorMessage]);
                }
            } else {
                // Show error message for invalid selection
                const errorMessage: Message = {
                    role: 'assistant',
                    content: 'Invalid ticker selection. Please choose a valid number.',
                    type: 'text'
                };
                setDisplayMessages(prev => [...prev, errorMessage]);
            }
            return;
        }


        // Command handling for /token
        if (fullMessage.startsWith('/token')) {
            const tokenMessage: Message = {
                role: 'assistant',
                content: <TokenSetup /> as ReactNode,
                type: 'command'
            };
            setDisplayMessages(prev => [...prev, tokenMessage]);
            setInputMessage('');
            return;
        }

        // Command handling for /post
        if (fullMessage.startsWith('/post')) {
            const { selectedTicker } = useTickerStore.getState();
            const { accessToken, accessSecret } = useTwitterStore.getState();

            if (!selectedTicker) {
                const errorMessage: Message = {
                    role: 'assistant',
                    content: 'No ticker selected. Please use /select command first to choose a ticker.',
                    type: 'text'
                };
                setDisplayMessages(prev => [...prev, errorMessage]);
                return;
            }

            if (!accessToken || !accessSecret) {
                const errorMessage: Message = {
                    role: 'assistant',
                    content: 'Twitter credentials not set. Please use /token command first to set up your Twitter access.',
                    type: 'text'
                };
                setDisplayMessages(prev => [...prev, errorMessage]);
                return;
            }

            await handleTweetCommand(fullMessage);

            setInputMessage('');
            return;
        }

        if (fullMessage.startsWith('/tweet ') || fullMessage.startsWith('/tweets ')) {
            await handleTweetCommand(fullMessage);
            setInputMessage('');
            return;
        }

        // Inside handleSubmit function, add this before the other command handling:

        // Command handling for /generate-tweet
        if (fullMessage.startsWith('/generate-tweet') && activeNavbarTicker) {
            // Extract the number and prompt from the command
            const commandParts = fullMessage.replace('/generate-tweet', '').trim().split(' ');
            const numberOfTweets = parseInt(commandParts[0]);
            const tweetPrompt = commandParts.slice(1).join(' ').trim();

            // Validate number of tweets
            if (isNaN(numberOfTweets) || numberOfTweets <= 0 || numberOfTweets > 20) {
                const errorMessage: Message = {
                    role: 'assistant',
                    content: 'Please specify a valid number of tweets (1-20). Format: /generate-tweet [number] [prompt]',
                    type: 'text'
                };
                setDisplayMessages(prev => [...prev, errorMessage]);
                return;
            }

            // For display purposes, show the original message
            const displayMessage: Message = {
                role: 'user',
                content: fullMessage
            };

            setDisplayMessages(prev => [...prev, displayMessage]);
            setInputMessage('');

            try {
                // Get ticker info from stored map
                const { tickerInfo, selectedTicker } = useTickerStore.getState();
                if (selectedTicker) {
                    const tickerInfoUse = tickerInfo[selectedTicker];

                    if (!tickerInfo) throw new Error('Ticker info not found');

                    const trainingData = tickerInfoUse.training_data || [];
                    let twitterUrl = '';
                    let twitterData = null;

                    if (tickerInfoUse.urls && Array.isArray(tickerInfoUse.urls)) {
                        twitterUrl = tickerInfoUse.urls.find((url: string) => url.includes('twitter.com') || url.includes('x.com')) || '';
                        if (twitterUrl) {
                            // const username = twitterUrl.split('twitter.com/').pop()?.split('/')[0] || '';
                            // if (username) {
                            //     twitterData = await processTwitterData(username);
                            // }
                            try {
                                const urlObj = new URL(twitterUrl);
                                const pathname = urlObj.pathname;
                                const pathSegments = pathname.split('/').filter(segment => segment.length > 0);
                                let username = '';

                                if (pathSegments.length > 0) {
                                    username = pathSegments[0];
                                }

                                if (username) {
                                    twitterData = await processTwitterData(username);
                                }
                            } catch (error) {
                                console.error('Invalid URL:', twitterUrl);
                            }
                        }
                    }

                    const combinedData = {
                        training_data: trainingData,
                        twitter_data: twitterData
                    };

                    console.log('combinedData', combinedData)
                    const imageUrl = `data:image/png;base64,${tickerInfoUse.image_base64}`;

                    const textGenResponse = await fetch('/api/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            messages: [
                                {
                                    role: "system",
                                    content: `You are a helpful AI assistant trained to create content based on a given knowledge base. Using the example tweets provided in ${JSON.stringify(twitterData)}, learn the unique tone, style, and personality reflected in the writing, such as humor, formality, common themes, and favorite topics. Generate exactly ${numberOfTweets} new tweets in a style inspired by the given tweets, but ensure the wording, topics, and expressions are unique.

Output the tweets in the following JSON format:

{
  "tweets": [
    {"tweet": "tweet1"},
    {"tweet": "tweet2"},
    ...
  ]
}

If the user requests an image related to a tweet, generate a detailed prompt for an image that aligns with the character style (see attached image) and matches the tweet's content. Use the format:
{
  "prompt": "<generated_prompt>"
}
In addition to the tweets, use ${JSON.stringify(trainingData)} as supplementary knowledge for topics to include in the tweets. Keep responses strictly in these formats.`
                                },
                                {
                                    role: 'user',
                                    content: [{
                                        type: 'text',
                                        text: tweetPrompt,
                                    }, {
                                        type: 'image_url',
                                        image_url: {
                                            url: imageUrl
                                        }
                                    }]
                                }
                            ]
                        })
                    });

                    if (!textGenResponse.ok) throw new Error('Failed to generate text');
                    const textGenData = await textGenResponse.json();

                    try {
                        // Try parsing the response as JSON first
                        const parsedContent = JSON.parse(textGenData.content);
                        if (parsedContent.tweets && Array.isArray(parsedContent.tweets)) {
                            parsedContent.tweets.forEach((tweetObj: any) => {
                                if (tweetObj.tweet) {
                                    setGeneratedTweets(prev => [...prev, { tweet: tweetObj.tweet }]);
                                }
                            });
                        }
                    } catch (e) {
                        // Fallback to regex parsing if JSON parsing fails
                        const tweetContent = textGenData.content.match(/"tweet":\s*"([^"]*)"/g);
                        if (tweetContent) {
                            const tweets = tweetContent.map((match: string) =>
                                match.split('"tweet":')[1].trim().replace(/(^"|"$)/g, '')
                            );
                            tweets.forEach((tweet: string) => {
                                setGeneratedTweets(prev => [...prev, { tweet }]);
                            });
                        }
                    }

                    setShowTweetPanel(true);

                    let rawContent = textGenData.content;

                    // Remove any backticks or markdown-like markers
                    rawContent = rawContent.replace(/```json|```/g, '');

                    // Parse the cleaned JSON string
                    const textGenDataContent = JSON.parse(rawContent);

                    // Map the parsed JSON to `generatedTweets` format
                    // const generatedTweet = textGenDataContent.tweets.map((item: { tweet: any; }) => ({ tweet: item.tweet }));

                    const generatedTweet = textGenDataContent.tweets.map((item: { tweet: any; }, index: number) => ({
                        tweet: item.tweet,
                        id: index + 1
                    }));
                    setGeneratedTweets(generatedTweet);

                    // Handle the response
                    const assistantMessage: Message = {
                        role: 'assistant',
                        // content: textGenData.content,
                        content: <GeneratedTweetsTable
                            tweets={generatedTweet}
                            wallet={wallet.publicKey?.toString() ?? ""}
                            ticker={activeNavbarTicker} />,
                        type: 'text'
                    };
                    setDisplayMessages(prev => [...prev, assistantMessage]);

                    // Rest of the image generation code remains the same
                    let promptMatch;
                    try {
                        const contentObj = JSON.parse(textGenData.content);
                        if (contentObj.arguments?.prompt) {
                            promptMatch = contentObj.arguments.prompt;
                        }
                    } catch (e) {
                        promptMatch = textGenData.content.match(/"prompt"\s*:\s*"([^"]+)"/)?.[1];
                    }

                    if (promptMatch) {
                        const tickerSeed = tickerInfoUse ? tickerInfoUse.seed : -1;
                        const tickerUserPrompt = tickerInfoUse ? tickerInfoUse.user_prompt : '';

                        const fullPrompt = tickerUserPrompt ? `${promptMatch} with character ${tickerUserPrompt}` : promptMatch;

                        const imageGenResponse = await fetch('/api/chat', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                messages: [...apiMessages],
                                directCommand: {
                                    type: 'image-gen',
                                    prompt: fullPrompt,
                                    seed: tickerSeed,
                                }
                            })
                        });

                        if (!imageGenResponse.ok) throw new Error('Failed to generate image');
                        const imageData = await imageGenResponse.json();

                        const imageMessage: Message = {
                            role: 'assistant',
                            content: imageData.content,
                            type: 'image',
                            command: 'image-gen'
                        };

                        setDisplayMessages(prev => [...prev, imageMessage]);
                    }
                }
            } catch (error) {
                console.error('Error in generate-tweet command:', error);
                const errorMessage: Message = {
                    role: 'assistant',
                    content: 'Sorry, there was an error processing your tweet generation request.',
                    type: 'text'
                };
                setDisplayMessages(prev => [...prev, errorMessage]);
            }
            return;
        }

        if (fullMessage.startsWith('/save') || fullMessage.startsWith('/saves')) {
            if (!activeNavbarTicker) {
                const errorMessage: Message = {
                    role: 'assistant',
                    content: 'No ticker selected. Please select a ticker first.',
                    type: 'text'
                };
                setDisplayMessages(prev => [...prev, errorMessage]);
                return;
            }

            if (generatedTweets.length === 0) {
                const errorMessage: Message = {
                    role: 'assistant',
                    content: 'No generated tweets found. Please generate tweets first using /generate-tweet command.',
                    type: 'text'
                };
                setDisplayMessages(prev => [...prev, errorMessage]);
                return;
            }

            try {
                const command = fullMessage.trim();
                const parts = command.split(' ');

                const numberStr = fullMessage.replace('/save', '').trim();
                const selectedIndex = parseInt(numberStr) - 1;

                // Handle single tweet save
                if (command.startsWith('/save ')) {
                    if (isNaN(selectedIndex) || selectedIndex < 0) {
                        throw new Error('Invalid tweet ID');
                    }

                    const tweetToSave = generatedTweets[selectedIndex];

                    // Construct the payload with only the selected tweet
                    const payload = {
                        wallet_address: wallet.publicKey?.toString(),
                        ticker: activeNavbarTicker,
                        tweets: [{
                            tweet_text: tweetToSave.tweet,
                            tweet_img: null  // Add if required
                        }]
                    };

                    const response = await fetch('https://zynapse.zkagi.ai/contentengine_generatedtweet', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'api-key': 'zk-123321'
                        },
                        body: JSON.stringify(payload)
                    });

                    if (!response.ok) throw new Error('Failed to save tweet');

                    const successMessage: Message = {
                        role: 'assistant',
                        content: `Successfully saved tweet #${selectedIndex + 1}`,
                        type: 'text'
                    };
                    setDisplayMessages(prev => [...prev, successMessage]);
                }
                // Handle multiple tweets save
                // Modified save tweets function
                else if (command.startsWith('/saves ')) {
                    const tweetIds = parts[1].split(',').map(id => parseInt(id.trim()) - 1);

                    // Collect all valid tweets first
                    const tweetsToSave = tweetIds
                        .filter(tweetId => {
                            if (isNaN(tweetId) || tweetId < 0 || tweetId >= generatedTweets.length) {
                                console.error(`Invalid tweet ID: ${tweetId + 1}`);
                                return false;
                            }
                            return true;
                        })
                        .map(tweetId => ({
                            tweet_text: generatedTweets[tweetId].tweet,
                            tweet_img: null // Add image data if needed
                        }));

                    // Format payload according to API requirements
                    const payload = {
                        wallet_address: wallet.publicKey?.toString(),
                        ticker: activeNavbarTicker,
                        tweets: tweetsToSave  // Use 'tweets' instead of 'tweet_text'
                    };

                    const response = await fetch('https://zynapse.zkagi.ai/contentengine_generatedtweet', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'api-key': 'zk-123321'
                        },
                        body: JSON.stringify(payload)
                    });

                    if (!response.ok) {
                        throw new Error(`Failed to save tweets: ${response.statusText}`);
                    }

                    const savedTweetNumbers = tweetIds.map(id => id + 1).join(', ');
                    const successMessage: Message = {
                        role: 'assistant',
                        content: tweetIds.length === 1
                            ? `Successfully saved tweet #${savedTweetNumbers}`
                            : `Successfully saved tweets #${savedTweetNumbers}`,
                        type: 'text'
                    };
                    setDisplayMessages(prev => [...prev, successMessage]);
                }
            }
            catch (error) {
                const errorMessage: Message = {
                    role: 'assistant',
                    content: `Error: ${error instanceof Error ? error.message : 'Failed to save tweet(s)'}`,
                    type: 'text'
                };
                setDisplayMessages(prev => [...prev, errorMessage]);
            }

            setInputMessage('');
            return;
        }

        if (fullMessage.startsWith('/character-gen')) {
            const { selectedTicker } = useTickerStore.getState();

            if (!selectedTicker) {
                const errorMessage: Message = {
                    role: 'assistant',
                    content: 'No ticker selected. Please use /select command first to choose a ticker.',
                    type: 'text'
                };
                setDisplayMessages(prev => [...prev, errorMessage]);
                return;
            }

            const characterMessage: Message = {
                role: 'assistant',
                content: <CharacterGenForm /> as ReactNode,
                type: 'command'
            };
            setDisplayMessages(prev => [...prev, characterMessage]);
            setInputMessage('');
            return;
        }


        // if (fullMessage.startsWith('/launch')) {
        //     const { selectedTicker } = useTickerStore.getState();

        //     // Step 1: Check if a ticker is selected
        //     if (!selectedTicker) {
        //         const errorMessage: Message = {
        //             role: 'assistant',
        //             content: 'No ticker selected. Please use /select command first to choose a ticker.',
        //             type: 'text',
        //         };
        //         setDisplayMessages((prev) => [...prev, errorMessage]);
        //         return;
        //     }

        //     // Step 2: Fetch coin info for the selected ticker
        //     try {
        //         const response = await fetch('https://zynapse.zkagi.ai/api/coins', {
        //             method: 'GET',
        //             headers: {
        //                 'Content-Type': 'application/json',
        //                 'api-key': 'zk-123321',
        //             },
        //         });

        //         if (!response.ok) {
        //             throw new Error('Failed to fetch coin info.');
        //         }

        //         const coins = await response.json();

        //         // Filter coins that match the selected ticker and have `memcoin_address` as `null`
        //         const filteredCoins = coins.data.filter(
        //             (coin: { ticker: string; memcoin_address: any; }) => coin.ticker === selectedTicker && !coin.memcoin_address
        //         );
        //         console.log('filteredCoins', filteredCoins)

        //         // Step 3: Show filtered coin options
        //         // const coinOptionsMessage: Message = {
        //         //     role: 'assistant',
        //         //     content: (
        //         //         <div>
        //         //             <p>Select a coin to launch:</p>
        //         //             <ul>
        //         //                 {filteredCoins.map((coin: { _id: string; coin_name: string }) => (
        //         //                     <li key={coin._id}>
        //         //                         <button
        //         //                             onClick={() => handleLaunchCoin(coin._id)}
        //         //                             className="text-blue-500 underline"
        //         //                         >
        //         //                             {coin.coin_name}
        //         //                         </button>
        //         //                     </li>
        //         //                 ))}
        //         //             </ul>
        //         //         </div>
        //         //     ),
        //         //     type: 'text',
        //         // };

        //         // setDisplayMessages((prev) => [...prev, coinOptionsMessage]);
        //         // const coinOptionsMessage: Message = {
        //         //     role: 'assistant',
        //         //     content: (
        //         //         <div>
        //         //             <p>Select a coin to launch:</p>
        //         //             <table className="min-w-full bg-white border-collapse border border-gray-200">
        //         //                 <thead>
        //         //                     <tr>
        //         //                         <th className="border border-gray-300 px-4 py-2">ID</th>
        //         //                         <th className="border border-gray-300 px-4 py-2">Coin Name</th>
        //         //                         <th className="border border-gray-300 px-4 py-2">Action</th>
        //         //                     </tr>
        //         //                 </thead>
        //         //                 <tbody>
        //         //                     {filteredCoins.length > 0 ? (
        //         //                         filteredCoins.map((coin: { _id: string; coin_name: string }) => (
        //         //                             <tr key={coin._id} className="hover:bg-gray-100">
        //         //                                 <td className="border border-gray-300 px-4 py-2">{coin._id}</td>
        //         //                                 <td className="border border-gray-300 px-4 py-2">{coin.coin_name}</td>
        //         //                                 <td className="border border-gray-300 px-4 py-2">
        //         //                                     <button
        //         //                                         onClick={() => handleLaunchCoin(coin._id)}
        //         //                                         className="text-blue-500 underline hover:text-blue-700"
        //         //                                     >
        //         //                                         Launch
        //         //                                     </button>
        //         //                                 </td>
        //         //                             </tr>
        //         //                         ))
        //         //                     ) : (
        //         //                         <tr>
        //         //                             <td colSpan={3} className="border border-gray-300 px-4 py-2 text-center">
        //         //                                 No coins available
        //         //                             </td>
        //         //                         </tr>
        //         //                     )}
        //         //                 </tbody>
        //         //             </table>
        //         //         </div>
        //         //     ),
        //         //     type: 'text',
        //         // };

        //         // setDisplayMessages((prev) => [...prev, coinOptionsMessage]);
        //         const coinOptionsMessage: Message = {
        //             role: 'assistant',
        //             content: (
        //                 <div className="w-full max-w-2xl bg-[#171D3D] rounded-lg p-4 shadow-lg">
        //                     <div className="mb-4 text-white font-semibold">Available Coins:</div>
        //                     <table className="w-full border-collapse">
        //                         <thead>
        //                             <tr className="text-left text-gray-400">
        //                                 <th className="p-2">#</th>
        //                                 <th className="p-2">Coin Name</th>
        //                                 <th className="p-2">Action</th>
        //                             </tr>
        //                         </thead>
        //                         <tbody>
        //                             {filteredCoins.length > 0 ? (
        //                                 filteredCoins.map((coin: { _id: string; coin_name: string }, index: number) => (
        //                                     <tr
        //                                         key={coin._id}
        //                                         className="border-t border-gray-700 hover:bg-[#24284E] cursor-pointer"
        //                                         onClick={() => handleLaunchCoin(coin._id)}
        //                                     >
        //                                         <td className="p-2 text-gray-400">{index + 1}</td>
        //                                         <td className="p-2 text-white">{coin.coin_name}</td>
        //                                         <td className="p-2">
        //                                             <button className="text-blue-500 underline hover:text-blue-700">
        //                                                 Launch
        //                                             </button>
        //                                         </td>
        //                                     </tr>
        //                                 ))
        //                             ) : (
        //                                 <tr>
        //                                     <td colSpan={3} className="p-2 text-center text-gray-400">
        //                                         No coins available
        //                                     </td>
        //                                 </tr>
        //                             )}
        //                         </tbody>
        //                     </table>
        //                     <div className="mt-4 text-gray-400 text-sm">
        //                         Enter /select [number] to choose a coin
        //                     </div>
        //                 </div>
        //             ),
        //             type: 'text',
        //         };

        //         setDisplayMessages((prev) => [...prev, coinOptionsMessage]);


        //     } catch (error) {
        //         const errorMessage: Message = {
        //             role: 'assistant',
        //             content: `Error: ${error}`,
        //             type: 'text',
        //         };
        //         setDisplayMessages((prev) => [...prev, errorMessage]);
        //     }
        //     return;
        // }

        if (fullMessage.startsWith('/launch')) {
            const { selectedTicker } = useTickerStore.getState();

            if (!selectedTicker) {
                const errorMessage: Message = {
                    role: 'assistant',
                    content: 'No ticker selected. Please use /select command first to choose a ticker.',
                    type: 'text',
                };
                setDisplayMessages((prev) => [...prev, errorMessage]);
                return;
            }

            const parts = fullMessage.trim().split(/\s+/);

            if (parts.length === 1) {
                // If just "/launch", show the table
                await showCoinsTable();
            } else if (parts.length === 2) {
                // If "/launch [number]", map the number to the coin's _id
                const coinIndexStr = parts[1];
                const coinIndex = parseInt(coinIndexStr, 10) - 1; // Adjust for zero-based index

                // Validate the index
                if (isNaN(coinIndex) || coinIndex < 0 || coinIndex >= filteredCoins.length) {
                    const errorMessage: Message = {
                        role: 'assistant',
                        content: 'Invalid coin number. Please enter a valid number from the list.',
                        type: 'text',
                    };
                    setDisplayMessages((prev) => [...prev, errorMessage]);
                    return;
                }

                const selectedCoin = filteredCoins[coinIndex] as { _id: string };
                const coinId = selectedCoin._id;

                // Pass the actual _id to handleLaunchCoin
                await handleLaunchCoin(coinId);
            }
            return;
        }


        // Check if message starts with a command
        const isImageGen = fullMessage.startsWith('/image-gen');
        const isMemeGen = fullMessage.startsWith('/meme-coin');
        const isContent = fullMessage.startsWith('/content');

        if (isImageGen || isMemeGen || isContent || activeNavbarTicker) {

            // if (fullMessage.startsWith('/content')) {
            //     // const ticker = fullMessage.split('content')[1]?.split('tweet')[0]?.trim() || '';
            //     const tickerSection = fullMessage.split('content')[1]?.trim() || '';
            //     const ticker = tickerSection && /(tweet|tweets)/.test(tickerSection)
            //         ? tickerSection.split(/\s+/)[0].trim()
            //         : '';

            //     console.log('ticker', ticker)
            //     const isImagePrompt = fullMessage.includes('image');

            //     try {
            //         // Get ticker info from stored map
            //         const tickerInfo = tickerInfoMap.get(ticker);
            //         console.log('tickerInfo', tickerInfo)


            //         if (!tickerInfo) throw new Error('Ticker info not found');

            //         // Extract training data and Twitter URL
            //         const trainingData = tickerInfo.training_data || [];
            //         let twitterUrl = '';
            //         let twitterData = null;

            //         // Process Twitter data if available
            //         if (tickerInfo.urls && Array.isArray(tickerInfo.urls)) {
            //             twitterUrl = tickerInfo.urls.find((url: string) => url.includes('twitter.com')) || '';
            //             if (twitterUrl) {
            //                 const username = twitterUrl.split('twitter.com/').pop()?.split('/')[0] || '';
            //                 if (username) {
            //                     twitterData = await processTwitterData(username);
            //                 }
            //             }
            //         }

            //         // Rest of the content generation logic remains the same
            //         const combinedData = {
            //             training_data: trainingData,
            //             twitter_data: twitterData
            //         };

            //         // Add user message and make API call
            //         const userMessage: Message = {
            //             role: 'user',
            //             content: fullMessage
            //         };
            //         setDisplayMessages(prev => [...prev, userMessage]);
            //         console.log('fullMessage', fullMessage)

            //         const cleanedMessage = fullMessage.replace(/^\/content\s+\S+\s+/, '').trim();
            //         const imageUrl = `data:image/png;base64,${tickerInfo.image_base64}`;


            //         const textGenResponse = await fetch('/api/chat', {
            //             method: 'POST',
            //             headers: { 'Content-Type': 'application/json' },
            //             body: JSON.stringify({
            //                 messages: [{ role: "system", content: `you are an helpful AI assistant which  can generate content using the given knowledge base. If the user asks to generate tweets give the response in given json format: {"tweet":<generated_tweet>}. If the user asks to generate image related to tweet then generate a prompt that should have a character consistency given in attached image and content related to tweet. Always create a prompt with character and tweet related to user requirements and respond in given format: {"prompt": <generated_prompt>} strictly follow the response format  ${JSON.stringify(combinedData)}` },
            //                 {
            //                     role: 'user',
            //                     content: [{
            //                         type: 'text',
            //                         text: cleanedMessage,
            //                     }, {
            //                         type: 'image_url',
            //                         image_url: {
            //                             url: imageUrl
            //                         }
            //                     }]

            //                 }]

            //             })
            //         });

            //         // Process and display response
            //         if (!textGenResponse.ok) throw new Error('Failed to generate text');
            //         const textGenData = await textGenResponse.json();

            //         // Check if the response contains a prompt for image generation
            //         let promptMatch;
            //         try {
            //             // Try to parse the content as JSON
            //             const contentObj = JSON.parse(textGenData.content);
            //             console.log('contentObj', contentObj)
            //             if (contentObj.arguments.prompt) {
            //                 promptMatch = contentObj.argumesnts.prompt;
            //             }
            //         } catch (e) {
            //             // If parsing fails, check for prompt using regex
            //             promptMatch = textGenData.content.match(/"prompt"\s*:\s*"([^"]+)"/)?.[1];
            //         }

            //         if (promptMatch) {
            //             const tickerSeed = tickerInfo ? tickerInfo.seed : -1;
            //             const tickerImage = tickerInfo ? tickerInfo.image_base64 : '';
            //             const tickerUserPrompt = tickerInfo ? tickerInfo.user_prompt : '';

            //             console.log('tickerImage', tickerImage)
            //             const fullPrompt = tickerUserPrompt ? `${promptMatch} with character ${tickerUserPrompt}` : promptMatch;
            //             // If prompt is found, call image generation
            //             const imageGenResponse = await fetch('/api/chat', {
            //                 method: 'POST',
            //                 headers: { 'Content-Type': 'application/json' },
            //                 body: JSON.stringify({
            //                     messages: [...apiMessages],
            //                     directCommand: {
            //                         type: 'image-gen',
            //                         prompt: fullPrompt,
            //                         seed: tickerSeed,
            //                         // id_image: tickerImage
            //                     }
            //                 })
            //             });

            //             if (!imageGenResponse.ok) throw new Error('Failed to generate image');
            //             const imageData = await imageGenResponse.json();

            //             // Display both the text and image response
            //             const textMessage: Message = {
            //                 role: 'assistant',
            //                 content: textGenData.content,
            //                 type: 'text'
            //             };

            //             const imageMessage: Message = {
            //                 role: 'assistant',
            //                 content: imageData.content,
            //                 type: 'image',
            //                 command: 'image-gen'
            //             };

            //             setDisplayMessages(prev => [...prev, textMessage, imageMessage]);
            //         } else {

            //             const assistantMessage: Message = {
            //                 role: 'assistant',
            //                 content: textGenData.content,
            //                 type: 'text'
            //             };
            //             setDisplayMessages(prev => [...prev, assistantMessage]);
            //         }
            //         setInputMessage('');
            //     }



            //-----------------------------------------------------------------------------------------------------s
            // if (activeNavbarTicker && !isImageGen && !isMemeGen && !isContent) {
            //     // Create the content command message
            //     const processedMessage = `/content ${activeNavbarTicker} ${fullMessage}`;

            //     // For display purposes, we'll show the original message
            //     const displayMessage: Message = {
            //         role: 'user',
            //         content: fullMessage
            //     };

            //     setDisplayMessages(prev => [...prev, displayMessage]);

            //     try {
            //         // Get ticker info from stored map
            //         const tickerInfo = tickerInfoMap.get(activeNavbarTicker);

            //         if (!tickerInfo) throw new Error('Ticker info not found');

            //         const trainingData = tickerInfo.training_data || [];
            //         let twitterUrl = '';
            //         let twitterData = null;

            //         if (tickerInfo.urls && Array.isArray(tickerInfo.urls)) {
            //             twitterUrl = tickerInfo.urls.find((url: string) => url.includes('twitter.com')) || '';
            //             if (twitterUrl) {
            //                 const username = twitterUrl.split('twitter.com/').pop()?.split('/')[0] || '';
            //                 if (username) {
            //                     twitterData = await processTwitterData(username);
            //                 }
            //             }
            //         }

            //         const combinedData = {
            //             training_data: trainingData,
            //             twitter_data: twitterData
            //         };

            //         // Use the original message without the /content prefix for display
            //         console.log('fullMessage', fullMessage);

            //         const cleanedMessage = fullMessage.trim();
            //         const imageUrl = `data:image/png;base64,${tickerInfo.image_base64}`;

            //         const textGenResponse = await fetch('/api/chat', {
            //             method: 'POST',
            //             headers: { 'Content-Type': 'application/json' },
            //             body: JSON.stringify({
            //                 messages: [
            //                     {
            //                         role: "system",
            //                         content: `you are an helpful AI assistant which can generate content using the given knowledge base. If the user asks to generate tweets give the response in given json format: {"tweet":<generated_tweet>}. If the user asks to generate image related to tweet then generate a prompt that should have a character consistency given in attached image and content related to tweet. Always create a prompt with character and tweet content related to user requirements and respond in given format: {"prompt": <generated_prompt>} strictly follow the response format  ${JSON.stringify(combinedData)}`
            //                     },
            //                     {
            //                         role: 'user',
            //                         content: [{
            //                             type: 'text',
            //                             text: cleanedMessage,
            //                         }, {
            //                             type: 'image_url',
            //                             image_url: {
            //                                 url: imageUrl
            //                             }
            //                         }]
            //                     }
            //                 ]
            //             })
            //         });

            //         // Process and display response
            //         if (!textGenResponse.ok) throw new Error('Failed to generate text');
            //         const textGenData = await textGenResponse.json();

            //         const tweetContent = textGenData.content.match(/"tweet":\s*"([^"]*)"/g);

            //         if (tweetContent) {
            //             const tweets = tweetContent.map((match: string) => match.split('"tweet":')[1].trim().replace(/(^"|"$)/g, ''));
            //             tweets.forEach((tweet: any) => {
            //                 setGeneratedTweets(prev => [...prev, { tweet }]);
            //             });
            //             setShowTweetPanel(true);
            //         }

            //         // Handle image generation if needed
            //         let promptMatch;
            //         try {
            //             const contentObj = JSON.parse(textGenData.content);

            //             if (contentObj.arguments?.prompt) {
            //                 promptMatch = contentObj.arguments.prompt;
            //             }
            //         } catch (e) {
            //             promptMatch = textGenData.content.match(/"prompt"\s*:\s*"([^"]+)"/)?.[1];
            //             console.log("ok")
            //         }

            //         if (promptMatch) {
            //             const tickerSeed = tickerInfo ? tickerInfo.seed : -1;
            //             const tickerUserPrompt = tickerInfo ? tickerInfo.user_prompt : '';

            //             const fullPrompt = tickerUserPrompt ? `${promptMatch} with character ${tickerUserPrompt}` : promptMatch;

            //             const imageGenResponse = await fetch('/api/chat', {
            //                 method: 'POST',
            //                 headers: { 'Content-Type': 'application/json' },
            //                 body: JSON.stringify({
            //                     messages: [...apiMessages],
            //                     directCommand: {
            //                         type: 'image-gen',
            //                         prompt: fullPrompt,
            //                         seed: tickerSeed,
            //                     }
            //                 })
            //             });

            //             if (!imageGenResponse.ok) throw new Error('Failed to generate image');
            //             const imageData = await imageGenResponse.json();

            //             const textMessage: Message = {
            //                 role: 'assistant',
            //                 content: textGenData.content,
            //                 type: 'text'
            //             };

            //             const imageMessage: Message = {
            //                 role: 'assistant',
            //                 content: imageData.content,
            //                 type: 'image',
            //                 command: 'image-gen'
            //             };

            //             setDisplayMessages(prev => [...prev, textMessage, imageMessage]);
            //         } else {
            //             const assistantMessage: Message = {
            //                 role: 'assistant',
            //                 content: textGenData.content,
            //                 type: 'text'
            //             };
            //             setDisplayMessages(prev => [...prev, assistantMessage]);
            //         }
            //         setInputMessage('');
            //     }
            //     catch (error) {
            //         console.error('Error in content command:', error);
            //         // Add error message to display
            //         const errorMessage: Message = {
            //             role: 'assistant',
            //             content: 'Sorry, there was an error processing your request.',
            //             type: 'text'
            //         };
            //         setDisplayMessages(prev => [...prev, errorMessage]);
            //     }
            //     return; // Exit here to prevent further processing
            // }

            const commandType = isImageGen ? 'image-gen' : 'meme-coin';
            setCurrentCommand(commandType);
            // Extract the prompt part after the command
            const promptText = fullMessage.replace(isImageGen ? '/image-gen' : '/meme-coin', '').trim();


            // Create message objects
            const displayMessage: Message = {
                role: 'user',
                content: fullMessage
            };
            const apiMessage: Message = {
                role: 'user',
                content: fullMessage,
                type: 'command',
                command: isMemeGen ? 'meme-coin' : 'image-gen'
            };

            setDisplayMessages(prev => [...prev, displayMessage]);
            setApiMessages(prev => [...prev, apiMessage]);
            setInputMessage('');
            setIsLoading(true);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 120000);

            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        messages: [...apiMessages, apiMessage],
                        directCommand: {
                            type: commandType,
                            prompt: promptText
                        }
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) throw new Error('Failed to get response');

                const data = await response.json();
                if (data.seed) {
                    setCurrentSeed(data.seed);
                }
                setProofData(data.proof);

                if (isMemeGen) {
                    if (data.content && typeof data.content === 'string') {
                        await handleMemeImageGeneration(data.content, promptText);
                    }
                }

                const assistantMessage: Message = {
                    role: 'assistant',
                    content: data.content,
                    type: 'image',
                    command: isMemeGen ? 'meme-coin' : 'image-gen'
                };

                setDisplayMessages(prev => [...prev, assistantMessage]);
                setApiMessages(prev => [...prev, {
                    role: 'assistant',
                    content: data.prompt || data.content,
                    type: 'image',
                    command: isMemeGen ? 'meme-coin' : 'image-gen'
                }]);

            } catch (error) {
                console.error('Error:', error);
            } finally {
                setIsLoading(false);
                setCurrentCommand(null);
            }
        }
        else {
            let displayMessageContent: any[] = [];
            let apiMessageContent: any[] = [];

            if (files.length > 0) {
                // Handle case when files are present
                if (inputMessage.trim()) {
                    displayMessageContent.push({
                        type: "text",
                        text: inputMessage.trim()
                    });
                    apiMessageContent.push({
                        type: "text",
                        text: inputMessage.trim()
                    });
                }



                for (const fileObj of files) {
                    if (fileObj.isPdf) {
                        // For display message: only add filename
                        displayMessageContent.push({
                            type: "text",
                            text: `[PDF: ${fileObj.file.name}]`
                        });

                        // For API message: add extracted text if available
                        if (pdfContent && fileObj.file.name === currentPdfName) {
                            apiMessageContent.push({
                                type: "text",
                                text: pdfContent
                            });
                        }
                    } else {
                        // For images, add to both display and API messages
                        const imageContent = {
                            type: "image_url",
                            image_url: {
                                url: fileObj.preview
                            }
                        };
                        displayMessageContent.push(imageContent);
                        apiMessageContent.push(imageContent);
                    }
                }
                const displayMessage: Message = {
                    role: 'user',
                    content: displayMessageContent
                };

                const apiMessage: Message = {
                    role: 'user',
                    content: apiMessageContent
                };

                setDisplayMessages(prev => [...prev, displayMessage]);
                setApiMessages(prev => [...prev, apiMessage]);

                setInputMessage('');
                setFiles([]);
                setPdfContent(null);
                setCurrentPdfName(null);
                setIsLoading(true);

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 120000);

                try {
                    const response = await fetch('/api/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            messages: [...apiMessages, apiMessage],
                        }),
                        signal: controller.signal
                    });

                    clearTimeout(timeoutId);

                    if (!response.ok) throw new Error('Failed to get response');

                    const data = await response.json();
                    setProofData(data.proof);

                    let assistantMessageForDisplay: Message;
                    let assistantMessageForAPI: Message;

                    if (data.type === 'image' || (typeof data.content === 'string' && data.content.startsWith('/'))) {
                        setResultType('image');
                        assistantMessageForDisplay = {
                            role: 'assistant',
                            content: data.content,
                        };
                        assistantMessageForAPI = {
                            role: 'assistant',
                            content: data.prompt || data.content,
                        };
                    } else {
                        assistantMessageForDisplay = {
                            role: 'assistant',
                            content: data.content,
                        };
                        assistantMessageForAPI = assistantMessageForDisplay;
                    }

                    setDisplayMessages(prev => [...prev, assistantMessageForDisplay]);
                    setApiMessages(prev => [...prev, assistantMessageForAPI]);

                } catch (error) {
                    console.error('Error:', error);
                } finally {
                    setIsLoading(false);
                    setCurrentCommand(null);
                }
            } else {
                // Existing text-only handling
                const userMessage: Message = { role: 'user', content: inputMessage };

                setDisplayMessages((prev) => [...prev, userMessage]);

                const apiMessage: Message = { role: 'user', content: inputMessage };
                setApiMessages((prev) => [...prev, apiMessage]);

                setInputMessage('');
                setIsLoading(true);

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 120000);

                try {
                    const response = await fetch('/api/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            messages: [...apiMessages, apiMessage],
                        }),
                        signal: controller.signal
                    });
                    clearTimeout(timeoutId);

                    if (!response.ok) throw new Error('Failed to get response');

                    const data = await response.json();

                    let assistantMessageForDisplay: Message;
                    let assistantMessageForAPI: Message;

                    setProofData(data.proof);

                    if (data.type === 'img') {
                        setResultType(data.type)
                        assistantMessageForDisplay = {
                            role: 'assistant',
                            content: data.content,
                        };
                        assistantMessageForAPI = {
                            role: 'assistant',
                            content: data.prompt,
                        };
                    } else {
                        assistantMessageForDisplay = {
                            role: 'assistant',
                            content: data.content,
                        };
                        assistantMessageForAPI = assistantMessageForDisplay;
                    }

                    setDisplayMessages((prev) => [...prev, assistantMessageForDisplay]);
                    setApiMessages((prev) => [...prev, assistantMessageForAPI]);

                } catch (error) {
                    console.error('Error:', error);
                } finally {
                    setIsLoading(false);
                }
            }
        }
        setCommandPart('');
        setNormalPart('');
    };

    const showCoinsTable = async () => {
        const { selectedTicker } = useTickerStore.getState();
        try {
            const response = await fetch('https://zynapse.zkagi.ai/api/coins', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': 'zk-123321',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch coin info.');
            }

            const coins = await response.json();
            const filteredCoins = coins.data.filter(
                (coin: { ticker: string; memcoin_address: any; }) =>
                    coin.ticker === selectedTicker && !coin.memcoin_address
            );
            setFilteredCoins(filteredCoins);

            console.log('filteredcoins', filteredCoins)

            const coinOptionsMessage: Message = {
                role: 'assistant',
                content: (
                    <div className="w-full max-w-2xl bg-[#171D3D] rounded-lg p-4 shadow-lg">
                        <div className="mb-4 text-white font-semibold">Available Coins:</div>
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="text-left text-gray-400">
                                    <th className="p-2">#</th>
                                    <th className="p-2">Coin Name</th>
                                    <th className="p-2">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCoins.length > 0 ? (
                                    filteredCoins.map((coin: { _id: string; coin_name: string }, index: number) => (
                                        <tr
                                            key={coin._id}
                                            className="border-t border-gray-700 hover:bg-[#24284E] cursor-pointer"
                                        >
                                            <td className="p-2 text-gray-400">{index + 1}</td>
                                            <td className="p-2 text-white">{coin.coin_name}</td>
                                            <td className="p-2">
                                                <button
                                                    className="text-blue-500 underline hover:text-blue-700"
                                                    onClick={() => handleLaunchCoin(coin._id)}
                                                >
                                                    Launch
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="p-2 text-center text-gray-400">
                                            No coins available
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        <div className="mt-4 text-gray-400 text-sm">
                            Enter /launch [id] to launch a specific coin
                        </div>
                    </div>
                ),
                type: 'text',
            };

            setDisplayMessages((prev) => [...prev, coinOptionsMessage]);
        } catch (error) {
            const errorMessage: Message = {
                role: 'assistant',
                content: `Error: ${error}`,
                type: 'text',
            };
            setDisplayMessages((prev) => [...prev, errorMessage]);
        }
    };


    const handleLaunchCoin = async (coinId: string) => {
        const { selectedTicker } = useTickerStore.getState();

        if (!selectedTicker) {
            console.error('Ticker not selected.');
            return;
        }

        try {
            // Get the coin details for the selected coin ID
            const response = await fetch('https://zynapse.zkagi.ai/api/coins', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': 'zk-123321',
                },
            });

            const coin = await response.json();
            const coins = coin.data;
            // const selectedCoin = coins.find((coin: { _id: string; }) => coin._id === coinId);

            const selectedCoin = coins.find((coin: { _id: any; }) => {
                return coin._id === coinId;
            });

            let memecoinAddress = '';
            if (wallet) {
                const tokenResult = await TokenCreator({
                    name: selectedCoin.coin_name,
                    symbol: selectedCoin.ticker,
                    description: selectedCoin.description,
                    imageBase64: 'data:image/png;base64,' + selectedCoin.image_base64,
                    wallet
                });

                console.log('Token created successfully:', tokenResult.signature);
                memecoinAddress = tokenResult.mintAddress;
            }
            else {
                throw new Error('Wallet not connected');
            }

            if (!selectedCoin) {
                throw new Error('Coin not found.');
            }

            // Perform the POST request to the `pmpCoinLaunch` API
            const launchResponse = await fetch('http:/zynapse.zkagi.ai/api/pmpCoinLaunch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ticker: selectedTicker,
                    memecoin_address: selectedCoin.address,
                }),
            });

            if (!launchResponse.ok) {
                throw new Error('Failed to launch coin.');
            }

            // Notify the user about the success
            const successMessage: Message = {
                role: 'assistant',
                content: `Successfully launched memecoin for ticker: ${selectedTicker}`,
                type: 'text',
            };
            setDisplayMessages((prev) => [...prev, successMessage]);
        } catch (error) {
            const errorMessage: Message = {
                role: 'assistant',
                content: `Error: ${error}`,
                type: 'text',
            };
            setDisplayMessages((prev) => [...prev, errorMessage]);
        }
    };

    // const handleLaunchCoin = async (coinId: string) => {
    //     const { selectedTicker } = useTickerStore.getState();

    //     if (!selectedTicker) {
    //         console.error('Ticker not selected.');
    //         return;
    //     }

    //     try {
    //         // Perform the POST request to launch the coin on pump.fun
    //         const launchResponse = await fetch('https://pump.fun/api/launch', {
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //                 'api-key': 'your-pump-fun-api-key', // Replace with actual API key if needed
    //             },
    //             body: JSON.stringify({
    //                 ticker: selectedTicker,
    //                 coin_id: coinId,
    //             }),
    //         });

    //         if (!launchResponse.ok) {
    //             throw new Error('Failed to launch coin.');
    //         }

    //         // Notify the user about the success
    //         const successMessage: Message = {
    //             role: 'assistant',
    //             content: `Successfully launched coin for ticker: ${selectedTicker}`,
    //             type: 'text',
    //         };
    //         setDisplayMessages((prev) => [...prev, successMessage]);
    //     } catch (error) {
    //         const errorMessage: Message = {
    //             role: 'assistant',
    //             content: `Error: ${error}`,
    //             type: 'text',
    //         };
    //         setDisplayMessages((prev) => [...prev, errorMessage]);
    //     }
    // };


    const setMemeData = useMemeStore((state) => state.setMemeData);

    const handleLaunchMemeCoin = () => {
        if (memeGenerationData && currentSeed && wallet) {
            setMemeData({
                name: memeGenerationData.name,
                description: memeGenerationData.description,
                prompt: memeGenerationData.prompt,
                base64Image: memeGenerationData.base64Image,
                seed: currentSeed,
                wallet: wallet.publicKey ? wallet.publicKey.toString() : ''
            });
            router.push('/memelaunch');
        } else {
            console.error('No meme generation data available');
            router.push('/memelaunch');
        }
    };

    const [loading, setLoading] = useState(false);

    const handleMintNFT = async (base64Image: string) => {
        setLoading(true);
        try {
            const { signature, assetPublicKey } = await createNft(wallet, base64Image, wallet.publicKey?.toString() || '');
            const metaplexUrl = `https://core.metaplex.com/explorer/${assetPublicKey}?env=devnet`;
            window.open(metaplexUrl, '_blank', 'noopener,noreferrer');
        } catch (error) {
            console.error("Failed to mint NFT:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        if (!proofData) {
            console.log('No proof data to download');
            return;
        }

        const blob = new Blob([JSON.stringify(proofData, null, 2)], { type: 'application/json' });

        if (window.showSaveFilePicker) {
            try {
                const handle = await window.showSaveFilePicker({
                    suggestedName: 'proof.json',
                    types: [{
                        description: 'JSON File',
                        accept: { 'application/json': ['.json'] },
                    }],
                });
                const writable = await handle.createWritable();
                await writable.write(blob);
                await writable.close();
            } catch (err) {
                console.error('Failed to save file:', err);
                // Fall back to the alternative method
                fallbackDownload(blob);
            }
        } else {
            fallbackDownload(blob);
        }
    };

    const fallbackDownload = (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'proof.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const renderMessageContent = (message: Message) => {
        if (React.isValidElement(message.content)) {
            return message.content;
        }
        if (Array.isArray(message.content)) {
            return (
                <div className="flex flex-col space-y-2">
                    {message.content.map((content, index) => {
                        if (content.type === 'text') {
                            if (content.text?.startsWith('[PDF:')) {
                                const pdfName = content.text.match(/\[PDF: (.*?)\]/)?.[1] || 'Unnamed PDF';
                                return (
                                    <div key={index} className="flex items-center space-x-2 bg-[#24284E] rounded-lg p-2 border border-[#BDA0FF]">
                                        <Image
                                            src="/images/pdf.svg"
                                            alt="PDF icon"
                                            width={20}
                                            height={20}
                                        />
                                        <span className="text-[#BDA0FF] text-xs">{pdfName}</span>
                                    </div>
                                );
                            }
                            return (
                                <div key={index} className="text-white">
                                    {renderTextContent(content.text || '')}
                                </div>
                            );
                        }
                        return null;
                    })}
                    {/* New wrapper for images */}
                    <div className="flex flex-row space-x-2">
                        {message.content
                            .filter(content => content.type === 'image_url')
                            .map((content, index) => (
                                <Image
                                    key={index}
                                    src={content.image_url?.url || ''}
                                    alt="Uploaded content"
                                    width={80}
                                    height={80}
                                    className="object-cover rounded-lg"
                                    layout="fixed"
                                    quality={75}
                                />
                            ))}
                    </div>
                </div>

            );
        }
        else if (typeof message.content === 'string') {
            // Check if it's a user message with a command
            if (message.role === 'user') {
                let displayedContent = message.content;

                // Handle '/image-gen' and '/meme-coin'
                if (displayedContent.startsWith('/image-gen')) {
                    // Remove '/image-gen' and show "Generate image of"
                    const prompt = displayedContent.replace('/image-gen', '').trim();
                    displayedContent = `Generate image of: ${prompt}`;
                } else if (displayedContent.startsWith('/meme-coin')) {
                    // Remove '/meme-coin' and show "Generate a meme for"
                    const prompt = displayedContent.replace('/meme-coin', '').trim();
                    displayedContent = `Generate a meme for: ${prompt}`;
                }

                // Render the modified content
                return <div className="text-white">{displayedContent}</div>;
            }

            // For assistant responses that are images
            if (message.role === 'assistant' && message.type === 'image') {
                return (
                    <ResultBlock
                        content={message.content}
                        type="image"
                        onMintNFT={handleMintNFT}
                        onDownloadProof={handleDownload}
                    />
                );
            } else {
                // For other assistant responses (text)
                return renderTextContent(message.content);
            }
        }
        return null;
    };


    const renderTextContent = (content: string) => {
        const parts = content.split('```');
        return parts.map((part, index) => {
            if (index % 2 === 0) {
                // This is regular text
                return (
                    <div key={index} className="mb-4">
                        {part.trim()}
                    </div>
                );
            } else {
                // This is a code block
                return (
                    <ResultBlock
                        key={index}
                        content={part.trim().split('\n').slice(1).join('\n')}
                        language={part.trim().split('\n')[0]}
                        type="code"
                        onDownloadProof={handleDownload}
                    />
                );
            }
        });
    };

    return (
        <div className="flex h-screen bg-gray-900 text-white ">
            {/* Sidebar code remains the same */}

            <div
                className={`
                    ${isMobile ? (isMenuOpen ? 'block' : 'hidden') : 'block'} 
                    ${isMobile ? 'w-3/4' : 'w-64'} 
                    bg-[#08121f] h-screen overflow-y-auto fixed left-0 top-0 z-20
                `}
            >
                <div className="p-4">
                    <div className="flex items-center justify-between mb-10">
                        <div className="relative bg-gradient-to-tr from-[#000D33] via-[#9A9A9A] to-[#000D33] p-0.5 rounded-lg w-full mr-4">
                            <input
                                type="text"
                                placeholder="Search"
                                className="w-full bg-[#08121f] text-white p-2 rounded-lg"
                            />
                        </div>
                        {isMobile && (
                            <button onClick={toggleMenu} className="text-white flex justify-center items-center font-sourceCode">
                                <BiMenuAltRight size={32} />
                            </button>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <div className="mb-4">ZkTerminal</div>
                        <div className="mb-4">Explore</div>
                        <div className="mb-4 flex flex-row items-center justify-start gap-2" data-marketplace-button
                            role="button"
                            tabIndex={0}><span> <Image
                                src="images/marketplace.svg"
                                alt="explore marketplace"
                                width={15}
                                height={15}
                                className='my-2'
                            /></span>Meme Coin Playground</div>
                        {/* <div className="mb-4">
                            <h3 className="text-lg font-semibold mb-2">Tickers</h3>
                            <div className="space-y-2">
                                {tickers.map((ticker, index) => (
                                    <div
                                        key={index}
                                        className="cursor-pointer hover:bg-gray-700 p-2 rounded"
                                        onClick={() => handleTickerSelect(ticker)}
                                    >
                                        {ticker}
                                    </div>
                                ))}
                            </div>
                        </div> */}
                        <Image
                            src="images/Line.svg"
                            alt="Welcome Line"
                            width={550}
                            height={50}
                            className='my-2'
                        />
                        <div className="mb-4">
                            <h3
                                className="text-lg font-semibold mb-2 cursor-pointer flex items-center justify-between"
                                onClick={toggleDropdown}
                            >
                                Tickers
                                {isDropdownOpen ? <FaChevronUp /> : <FaChevronDown />}
                            </h3>
                            {isDropdownOpen && (
                                <div className="space-y-2">
                                    {tickers.map((ticker, index) => (
                                        <div
                                            key={index}
                                            className="cursor-pointer hover:bg-gray-700 p-2 rounded"
                                            onClick={() => handleTickerSelect(ticker)}
                                        >
                                            {ticker}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="mb-4"><CustomWalletButton /></div>

                    </div>


                    {/* <nav>
                        {menuItems.map((item, index) => (
                            <div key={index} className="py-2 px-4 hover:bg-gray-700 cursor-pointer">
                                {item}
                            </div>
                        ))}
                    </nav> */}
                </div>
            </div>

            {/* Main content */}
            <div className={`flex-1 flex flex-col bg-[#08121f] ${!isMobile ? 'ml-64' : ''}`}>
                {/* Header code remains the same */}

                {/* <header className="w-full py-4 bg-[#08121f] flex justify-between items-center px-4">
                    {isMobile && (
                        <button onClick={toggleMenu} className="text-white">
                            <BiMenuAltLeft size={28} />
                        </button>
                    )}
                    <div className="text-lg font-semibold flex-1 flex justify-center items-center gap-2">
                        <div><Image
                            src="images/tiger.svg"
                            alt="logo"
                            width={30}
                            height={30}
                        /></div>
                        <div className='font-ttfirs text-xl'>ZkSurfer</div>
                    </div>
                    <div className="flex space-x-4">

                        <button className="text-black bg-white p-1 rounded-lg"><FaPen /></button>
                        <button className="text-white"><HiDotsVertical /></button>
                    </div>
                </header> */}

                <header className="w-full py-4 bg-[#08121f] flex justify-between items-center px-4">
                    {isMobile && (
                        <button onClick={toggleMenu} className="text-white">
                            <BiMenuAltLeft size={28} />
                        </button>
                    )}
                    <div className="text-lg font-semibold flex-1 flex justify-center items-center gap-2">
                        <div>
                            <Image
                                src="images/tiger.svg"
                                alt="logo"
                                width={30}
                                height={30}
                            />
                        </div>
                        <div className='font-ttfirs text-xl'>ZkTerminal</div>
                    </div>
                    <div className="flex items-center space-x-4">
                        {/* Add ticker display here */}
                        {activeNavbarTicker && (
                            <div
                                className={`
                    cursor-pointer 
                    px-3 
                    py-1 
                    rounded-lg 
                    text-white 
                    flex 
                    items-center 
                    gap-2
                    border-2 
                    border-green-500 
                    bg-[#1a2633]
                    hover:bg-[#243242]
                    transition-colors
                `}
                                onClick={() => handleTickerClick(activeNavbarTicker)}
                            >
                                <span>{activeNavbarTicker}</span>
                                <button
                                    className="text-gray-400 hover:text-white"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveNavbarTicker(null);
                                    }}
                                >
                                    <IoMdClose size={16} />
                                </button>
                            </div>
                        )}
                        <button className="text-black bg-white p-1 rounded-lg">
                            <FaPen />
                        </button>
                        <button className="text-white">
                            <HiDotsVertical />
                        </button>
                    </div>
                </header>


                <Image
                    src="images/Line.svg"
                    alt="Welcome Line"
                    width={550}
                    height={50}
                    className={`my-2 ${!isMobile ? 'hidden' : 'visible'}`}
                />

                {/* Chat messages */}
                <div className="flex-grow overflow-x-auto px-4 py-8">
                    {displayMessages.map((message, index) => (
                        <div key={index} className="mb-4 flex justify-start w-full">
                            <div className="flex-shrink-0 mr-3">
                                <div className="w-10 h-10 rounded-full bg-[#171D3D] border flex items-center justify-center">
                                    {message.role === 'user' ? (
                                        userEmail.charAt(0).toUpperCase()
                                    ) : (
                                        <Image
                                            src="images/tiger.svg"
                                            alt="logo"
                                            width={40}
                                            height={40}
                                            className='p-2'
                                        />
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col items-start">
                                <div className="flex items-center justify-between w-full mt-2">

                                    <span
                                        className={`flex justify-between items-center text-md text-gray-400 font-sourceCode ${message.role !== 'user' &&
                                            'bg-gradient-to-br from-zkIndigo via-zkLightPurple to-zkPurple bg-clip-text text-transparent'
                                            } ${!isMobile ? `mt-0.5` : ``}`}
                                    >
                                        {message.role === 'user' ? userEmail : 'ZkTerminal'}

                                    </span>
                                    {message.role !== 'user' && (
                                        <div className="flex space-x-2">
                                            <button className="text-white rounded-lg">
                                                <Image
                                                    src="images/Download.svg"
                                                    alt="logo"
                                                    width={20}
                                                    height={20}
                                                />
                                            </button>
                                            <button className="text-white rounded-lg">
                                                <Image
                                                    src="images/share.svg"
                                                    alt="logo"
                                                    width={20}
                                                    height={20}
                                                />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                {message.role === 'assistant' &&

                                    (typeof message.content === 'string' && message.content.startsWith('/')) ? (
                                    <ResultBlock
                                        content={message.content}
                                        type="image"
                                        onMintNFT={handleMintNFT}
                                        onDownloadProof={handleDownload}
                                        imageResultType={message.command}
                                        // onLaunchMemeCoin={message.command === 'meme-coin' ? () => router.push('/memelaunch') : undefined}
                                        onLaunchMemeCoin={message.command === 'meme-coin' ? handleLaunchMemeCoin : undefined}
                                    />
                                ) : (
                                    <div className="inline-block p-1 rounded-lg text-white">
                                        {renderMessageContent(message)}
                                    </div>
                                )}

                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="text-center">
                            <span className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></span>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <footer className="w-full py-4 flex justify-center px-4">
                    <div className={`bg-gradient-to-tr from-[#000D33] via-[#9A9A9A] to-[#000D33] p-0.5 rounded-lg ${!isMobile ? 'w-2/5' : 'w-full'}`}>
                        <form onSubmit={handleSubmit} className="w-full flex flex-col bg-[#08121f] rounded-lg">
                            {files.length > 0 && (
                                <div className="flex flex-wrap gap-2 p-2">
                                    {files.map((file, index) => (
                                        <div key={index} className="relative w-20 h-20">
                                            {file.isPdf ? (
                                                <div className="w-full h-full flex items-center justify-center bg-[#24284E] rounded-lg text-xs text-[#BDA0FF] text-center overflow-hidden p-1 border border-[#BDA0FF]">
                                                    {file.file.name}
                                                </div>
                                            ) : (
                                                <Image
                                                    src={file.preview}
                                                    alt={`Preview ${index}`}
                                                    width={500}
                                                    height={500}
                                                    className="w-full h-full object-cover rounded-lg"
                                                    layout="responsive"
                                                />
                                            )}
                                            <button
                                                onClick={() => removeFile(index)}
                                                className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
                                                type="button"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}


                            <div className="flex items-center">
                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    accept="image/*,.pdf"
                                    className="hidden"
                                    id="fileInput"
                                    multiple
                                    disabled={!wallet.connected}
                                />
                                <label
                                    htmlFor="fileInput"
                                    className={`flex items-center justify-center bg-[#08121f] text-white rounded-lg px-3 py-2 ${!wallet.connected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                                        }`}
                                    style={{
                                        height: '2.5rem', // Match the initial height of the textarea
                                    }}
                                >
                                    <Image
                                        src="/images/Attach.svg"
                                        alt="Attach file"
                                        width={20}
                                        height={20}
                                    />
                                </label>

                                {/* Textarea for input */}
                                <div className="relative w-full flex items-center bg-transparent py-1 mt-2 px-4 rounded-l-full">
                                    <textarea
                                        ref={inputRef}
                                        value={inputMessage}
                                        onChange={handleInputChange}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Message ZkTerminal"
                                        className="w-full resize-none overflow-y-auto bg-[#08121f] text-white rounded-lg placeholder-[#A0AEC0] focus:outline-none"
                                        style={{
                                            lineHeight: '1.5',
                                            height: '2.5rem', // Same initial height as the label
                                            maxHeight: '10rem', // Limit height to 10rem
                                            boxSizing: 'border-box',
                                        }}
                                        onInput={(e) => {
                                            const target = e.target as HTMLTextAreaElement;
                                            target.style.height = '2.5rem'; // Reset to the default height
                                            target.style.height = `${Math.min(target.scrollHeight, 160)}px`; // Adjust height dynamically
                                        }}
                                        disabled={!wallet.connected}
                                    />

                                    {showCommandPopup && (
                                        <CommandPopup onSelect={handleCommandSelect} />
                                    )}
                                    {showTickerPopup && (
                                        <TickerPopup tickers={tickers} onSelect={handleTickerSelect} />
                                    )}
                                </div>

                                {/* Submit button */}
                                <button
                                    type="submit"
                                    className="bg-white text-black p-1 m-1 rounded-md font-bold"
                                    style={{
                                        height: '1.5rem', // Same height as the textarea
                                    }}
                                    disabled={isLoading || !wallet.connected}
                                >
                                    <BsArrowReturnLeft />
                                </button>
                            </div>


                        </form>
                    </div>
                </footer>
            </div>

            {/* <div className="h-screen right-0 top-0">
                <TweetPanel
                    tweets={generatedTweets}
                    wallet={wallet.publicKey?.toString()}
                    ticker={activeNavbarTicker}
                    onClose={() => setShowTweetPanel(false)}
                    generatedTweet={tweets}
                />
            </div> */}


        </div>
    );
};

export default HomeContent;