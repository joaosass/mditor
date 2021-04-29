import {useState, useEffect, forwardRef, useRef} from 'react';

const Editor = forwardRef(({defaultData, placeholderText, uploadImage}, ref) => {
  const [data, setData] = useState(Array.from({length: 8}).map(() => {
    return ({
      tag: 'p',
      content: ''
    });
  }));
  const [showPlaceholder, setShowPlacedolder] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showInputLink, setShowInputLink] = useState(false);
  const [inputLink, setInputLink] = useState("");
  const [loading, setLoading] = useState(false);f
  const inputsRef = useRef([]);

  useEffect(() => {
    ref.current = {
      save: () => {
        return generateMD();
      }
    }
  });

  useEffect(() => {
    if (!data[data.length - 1].content && inputsRef.current[data.length - 1] && inputsRef.current.some((item) => {
      return !!item.content;
    })) {
      inputsRef.current[data.length - 1].focus();
    }
  }, [data.length, inputsRef]);

  useEffect(() => {
    if (defaultData){
      generateData(defaultData);
    }
  }, [defaultData]);

  const generateMD = () => {
    return data.map((item) => {
      let start = '';
      let end = '';
      if (item.link) {
        start = '[';
        end = '](' + item.link + ')';
      }

      if (item.tag === 'strong') {
        return start + '**' + item.content + '**' + end;
      } else if (item.tag === 'em') {
        return start + '*' + item.content + '*' + end;
      } else if (item.tag === 'h1') {
        return '# ' + item.content;
      } else if (item.tag === 'h2') {
        return '## ' + item.content;
      } else if (item.tag === 'h3') {
        return '### ' + item.content;
      } else if (item.tag === 'img') {
        return '![](' + item.content + ')';
      } else {
        return start + item.content + end;
      }
    }).filter((item) => {
      return !!item;
    }).join('\n\n');
  }

  const generateData = (md) => {
    let mdData = md.split("\n\n");
    let h1MD = /^#\s/g;
    let h2MD = /^##\s/g;
    let h3MD = /^###\s/g;
    let imgMD = /(^\!\[\]\()|(\)$)/g;
    let boldMD = /(^\*\*)|(\*\*$)/g;
    let italicMD = /(^\*)|(\*$)/g;
    let linkMD = /(^\[)|(\]\()|(\)$)/g;
    let result = (mdData.map((item) => {
      let tag = 'p';
      let content = item = item.trim();
      let link;
      if ((item.match(linkMD) || []).length === 3){
        let split = item.split(/\]\(/g);
        link = split[1].replace(/\)$/g, "");
        content = item = split[0].replace(/\[/g, "");
      }

      if (h1MD.test(item)){
        tag = 'h1';
        content = item.replace(h1MD, "");
      } else if (h2MD.test(item)){
        tag = 'h2';
        content = item.replace(h2MD, "");
      } else if (h3MD.test(item)){
        tag = 'h3';
        content = item.replace(h3MD, "");
      } else if ((item.match(imgMD) || []).length === 2){
        tag = 'img';
        content = item.replace(imgMD, "");
      } else if ((item.match(boldMD)|| []).length === 2){
        tag = 'strong';
        content = item.replace(boldMD, "");
      } else if ((item.match(italicMD) || []).length === 2){
        tag = 'em';
        content = item.replace(italicMD, "");
      }
      return {tag, content, link}
    }));
    setData(result);
    setShowPlacedolder(false);
  }

  const handleTags = (tag, content, index) => {
    if (tag !== "img"){
      return <textarea key={index} className={'editorMD__' + tag} value={content} onChange={(evt) => handleChangeContent(evt, index)} onKeyPress={handleKeyPress} onKeyDown={(evt) => handleDeleteLine(evt, index)} onFocus={() => {
        setCurrentIndex(index);
      }} ref={(inputRef) => {
        if (inputRef) {
          handleAdjustHeight(inputRef);
        }
        return inputsRef.current[index] = inputRef;
      }} />
    } else {
      return <div key={index} className="editorMD__imageContainer" onClick={() => handleDeleteImage(index)}>
        <img className="editorMD__trash" src="/trash.svg" />
        <img src={content} />
      </div>
    }
  }

  const handleChangeContent = (evt, index) => {
    setShowPlacedolder(false);
    setData(data.map((item, ind) => {
      if (ind === index){
        item.content = evt.target.value.replace('\n', '');
      }
      return item;
    }));
    handleAdjustHeight(evt.target);
  }

  const handleAdjustHeight = (elem) => {
    elem.style.height = "1em";
    elem.style.height = (elem.scrollHeight) + "px";
  }

  const handleKeyPress = (evt) => {
    if (evt.key === 'Enter') {
      handleCreateNewLine();
    }
  }

  const handleCreateNewLine = () => {
    if(data.length - 1 === currentIndex) {
        setData([...data, {tag: 'p', content: ''}]);
      } else {
        inputsRef.current[currentIndex + 1].focus();
      }
      setCurrentIndex(currentIndex + 1);
  }

  const handleDeleteLine = (evt, index) => {
    if (evt.key === 'Backspace' && !evt.target.value && data.length > 1) {
      setData(data.filter((item, ind) => {
        return ind !== index;
      }));
      let newCurrentIndex = currentIndex > 0 ? (currentIndex - 1) : 0
      inputsRef.current[newCurrentIndex].focus();
      setCurrentIndex(newCurrentIndex);
    }
  }

  const handleDeleteImage = (index) => {
    if (data.length > 1) {
      setData(data.filter((item, ind) => {
        return ind !== index;
      }));
    } else {
      setData({
        tag: 'p',
        content: '',
      })
    }
  }

  const handleTagEditing = (tag) => {
    setData(data.map((item, index) => {
      if (index === currentIndex) {
        if (item.tag === tag) {
          item.tag = 'p';
        } else {
          item.tag = tag;
        }
      }

      return item;
    }));
  }

  const handleBold = () => {
    handleTagEditing('strong')
  }

  const handleItalic = () => {
    handleTagEditing('em')
  }

  const handleH1 = () => {
    handleTagEditing('h1')
  }

  const handleH2 = () => {
    handleTagEditing('h2')
  }

  const handleH3 = () => {
    handleTagEditing('h3')
  }

  const handleImage = async(evt) => {
    setLoading(true);
    let file = evt.target.files[0];
    let url = await uploadImage(file);
    setData(data.map((item, index) => {
      if (index === currentIndex) {
        item.tag = 'img';
        item.content = url;
      }

      return item;
    }));
    handleCreateNewLine();
    setLoading(false);
  }

  const handleLink = () => {
    if (data[currentIndex].tag !== 'img') {
      setShowInputLink(true);
      setInputLink(data[currentIndex].link);
    }
  }

  const cleanInput = (evt) => {
    evt.target.value = null;
  }

  const handleInputLink = (evt) => {
    setInputLink(evt.target.value);
  }

  const confirmLink = (evt) => {
    evt.stopPropagation();
    setData(data.map((item, index) => {
      if (index === currentIndex) {
        if(/h/.test(item.tag)){
          item.tag = 'p';
        }
        item.link = inputLink;
        item.content = item.content || inputLink;
      }

      return item;
    }));
    setInputLink('');
    setShowInputLink(false);
  }

  return <div className="editorMD__container" >
    {loading && <div className="editorMD__loading">
      <img src="/loading.gif" />
    </div>}
    <div className="editorMD__tab">
      <button onClick={handleH1}>
        <img src="/H1.svg" />
      </button>
      <button onClick={handleH2}>
        <img src="/H2.svg" />
      </button>
      <button onClick={handleH3}>
        <img src="/H3.svg" />
      </button>
      <button onClick={handleBold}>
        <img src="/B.svg" />
      </button>
      <button onClick={handleItalic}>
        <img src="/I.svg" />
      </button>
      <button>
        <img src="/image.svg" />
        <input className="editorMD__invisibleInput" type="file" onChange={handleImage} onClick={cleanInput} />
      </button>
      <button onClick={handleLink}>
        <img src="/link.svg" />
        {showInputLink && <div className="editorMD__hidedInput">
          <input value={inputLink} onChange={handleInputLink} />
          <div>
            <button className="editorMD__button" onClick={confirmLink}>Ok</button>
          </div>
        </div>}
      </button>
    </div>
    {showPlaceholder && <strong className="editorMD__placeholder">{placeholderText}</strong>}
    {data.map((item, index) => {
      return handleTags(item.tag, item.content, index);
    })}
  </div>
})

export default Editor;
