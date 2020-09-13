import React from 'react';
import no_file from 'assets/dashboard/no_file.png';
import Skeleton from 'react-skeleton-loader';
import FilesSec from './FileSec';
import Drag from '../Drag';
import './style.scss';

const Files = ({
  files,
  view,
  download,
  handleImage,
  deleteFile,
  showdrag = true,
  personal = false,
  children,
}) => {
  return (
    <div className="info_con">
      <div className="info_con_sec scrolled flex-col al-start j-start">
        {!files ? (
          <div className="flex-col" style={{ width: '100%', height: '100%' }}>
            {[1, 2, 3].map((i) => (
              <div
                key={`file_loader_${i}`}
                style={{
                  height: i === 1 ? '50px' : '10px',
                  width: '80%',
                  marginBottom: '5px',
                }}
              >
                <Skeleton width="100%" />
              </div>
            ))}
          </div>
        ) : files.length === 0 ? (
          <div className="n_available flex-col img">
            <img src={no_file} alt="no classes" />
            <p className="txts">You have no files yet</p>
          </div>
        ) : (
          files.map((file, i) => (
            <FilesSec
              file={file}
              key={`d_files_${i}`}
              view={view}
              download={download}
              deleteFile={deleteFile}
              personal={personal}
            />
          ))
        )}
      </div>

      {showdrag && (
        <Drag
          className="add_file"
          children={children}
          handleImage={handleImage}
        />
      )}
    </div>
  );
};

export default Files;
