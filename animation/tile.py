import sys, json
from PIL import Image, ImageDraw, ImageFont
out=sys.argv[1]; meta=json.load(open(out+'.json'))
ims=[Image.open(f) for f in meta['files']]; w,h=ims[0].size; cols=meta['cols']; rows=-(-len(ims)//cols)
sheet=Image.new('RGB',(w*cols,h*rows),'black'); font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', max(12,h//14))
for i,im in enumerate(ims):
    d=ImageDraw.Draw(im); d.rectangle([0,0,110,h//10],fill='black'); d.text((6,2),f"t={meta['times'][i]}",fill='yellow',font=font)
    sheet.paste(im,((i%cols)*w,(i//cols)*h))
sheet.save(out); print('wrote',out,sheet.size)
