import { fileOpen } from 'browser-fs-access';
import FileSaver from 'file-saver';

export async function saveAs({
  dataStr = '',
  description = `Refer-${new Date().getTime()}`,
  accept = { "application/json": [".json"] },
}: {
  dataStr?: string;
  accept?: any;
  description?: string;
}) {
  if (window.showSaveFilePicker) {
    const options = {
      types: [
        {
          description,
          accept
        },
      ],
    };

    const handle = await window.showSaveFilePicker(options);
    const writable = await handle.createWritable();

    await writable.write(dataStr);
    await writable.close();
  } else {
    var blob = new Blob([dataStr], { type: "application/json;charset=utf-8" });
    FileSaver.saveAs(blob, `refer.${new Date().getTime()}.json`);
  }
}

export { fileOpen };
