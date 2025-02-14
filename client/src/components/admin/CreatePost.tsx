import { ChangeEvent, FormEvent, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { Editor } from "primereact/editor";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

import { 
  useUploadPostImgMutation, 
  useCreatePostMutation, 
  useDeletePostImgMutation 
} from "../../features/postApiSlice";

import { Input, CustomToolbar } from "..";
import { errorType } from "../../constants/interfaces";
import { toastify } from "../../utils";

const initialFormData = {
  title: "", category: "", content: "", imgId: ""
};

const CreatePost = () => {
  const [formData, setFormData] = useState(initialFormData);
  const [postImg, setPostImg] = useState<File | null>();

  const location = useLocation();
  const navigate = useNavigate();

  const [createPost, { isLoading: isCreating }] = useCreatePostMutation();
  const [uploadPostImg, { isLoading: isUploading }] = useUploadPostImgMutation();
  const [deletePostImg] = useDeletePostImgMutation();

  useEffect(() => {
    ( async () => await deletePostImg() )();
  }, [location]);

  const handleFormChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleContent = (e: any) => setFormData({ ...formData, content: e.htmlValue });

  const uploadPostImage = async () => {
    if (!postImg) {
      toastify("No image was selected !!!", 0);
      return;
    }
    
    const form = new FormData();
    const imgId = uuidv4().replace(new RegExp('-', 'g'), '');
    form.append('postImg', postImg);
    
    const { error } = await uploadPostImg({ formData: form, id: imgId });
    const err = error as errorType | undefined;
    
    if (err) {
      switch (err.originalStatus) {
        case 400:
          toastify("Image not uploaded. Try again...", 0);
          break;
        case 200:
          setFormData({ ...formData, imgId });
          toastify("Image uploaded successfully !!!", 1);
          break;
      }
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const buttonClicked = (e.nativeEvent as any).submitter as HTMLButtonElement;

    if (buttonClicked.id === 'post-img-upload') {
      await uploadPostImage();
      return;
    }

    if (buttonClicked.id === 'create-post') {
      if (!formData.title || !formData.category || !formData.content) {
        toastify("All fields must be filled before submitting.", 0);
        return;
      }

      if (!formData.imgId) {
        toastify("No image was uploaded", 0);
        return;
      }

      const { data, error } = await createPost(formData);
      const err = error as errorType | undefined;
    
      if (err) {
        switch (err.originalStatus) {
          case 400:
            toastify("All fields are required.", 0);
            return;
          case 422:
            toastify("Image not uploaded.", 0);
            return;
          case 404:
            toastify("Image wasn't found. Try uploading once again...", 0);
            return;
          case 502:
            toastify("Failed to upload the image. Try again...", 0);
            return;
          case 500:
            toastify("Server not responding.", 0);
            return;
          default:
            toastify("Something went wrong !!!", 0);
            return;
        }
      }

      toastify("Post created successfully !!!", 1);
      setFormData(initialFormData);
      setPostImg(null);
      navigate(`/portal/posts/${data._id}`);
    }
  };

  return (
    <main className="w-full mb-5">
      <h1 className="text-2xl text-center font-semibold my-5 text-dark-0 dark:text-lite-1">Create a post</h1>

      <form className="xl:w-[65%] lg-md:w-[80%] md:w-[85%] w-[95%] flex flex-col gap-3 mx-auto" onSubmit={handleSubmit}>
        <div className="flex max-sm:flex-col justify-center gap-3">
          <Input
            name="title"
            type="text"
            placeholder="Title"
            value={formData.title}
            handleChange={handleFormChange} 
            notRequired
          />
          <select 
            name="category"
            className="lg:w-1/4 lg-md:w-[35%] max-sm:py-1.5 outline outline-1 outline-lite-2 bg-lite-1 rounded-[3px] text-sm px-3 dark:bg-dark-2 dark:outline-dark-3 dark:text-lite-2"
            value={formData.category}
            onChange={handleFormChange}
          >
            <option hidden>Select a category</option>
            <option value="exploration">Exploration</option>
            <option value="science">Science</option>
            <option value="others">Others</option>
          </select>
        </div>

        <div className="py-2 px-2.5 flex justify-between border-2 border-dotted border-green-500">
          <div 
            className="flex outline outline-1 outline-lite-2 font-medium rounded-md"
            onClick={() => document.getElementById('postImg')?.click()}
          >
            <input 
              id="postImg" 
              name="postImg"  
              type="file" 
              onChange={(e) => setPostImg(e.target.files?.[0])} 
              accept="image/*" 
              hidden 
            />
            <button type="button" className="px-2 py-2.5 bg-black text-lite-1 rounded-l-md text-[13px]">Choose file</button>
            <p id="filename" className="px-2 py-2.5 text-[13px] cursor-default bg-lite-1 dark:bg-dark-2 dark:text-lite-2">{!postImg?.name ? "No file chosen" : postImg?.name}</p>
          </div>
          <button 
            id="post-img-upload"
            type="submit"
            className={`h-fit rounded-md ${isUploading ? "bg-white dark:bg-dark-0" : "bg-gradient-to-r from-teal-500 via-cyan-500 to-sky-500"}`}
            disabled={isUploading}
          >
            <div className="p-0.5 rounded-md">
              <div className={`text-[13px] p-2 font-semibold bg-white rounded-md md:px-4 md:py-2 ${!isUploading && "hover:bg-transparent hover:text-white dark:hover:bg-transparent"} dark:bg-dark-0 dark:text-white`}>Upload Image</div>
            </div>
          </button>
        </div>

        <Editor
          style={{ height: '265px' }}
          value={formData.content}
          onTextChange={handleContent}
          headerTemplate={<CustomToolbar />}
        />

        <button 
          id="create-post"
          type="submit"
          className={`group h-fit mt-2 bg-gradient-to-r rounded-[4px] ${isCreating ? "from-purple-900 via-fuchsia-900 to-pink-900" : "from-purple-500 via-fuchsia-500 to-pink-500 hover:sign-in-hover"}`}
          disabled={isCreating}
        >
          <div className="p-0.5 rounded-[4px]">
            <div className="font-semibold p-2 rounded-[4px] md:px-2 md:py-1 bg-transparent text-sm text-white group-hover:tracking-tighter">Publish</div>
          </div>
        </button>
      </form>
    </main>
  );
};

export default CreatePost;
