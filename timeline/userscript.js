// ==UserScript==
// @name         HN Comments Timeline
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Adds a timeline bar to highlight new comments.
// @author       You
// @match        https://news.ycombinator.com/item?id=*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        All
// @run-at       document-start
// ==/UserScript==

window.addEventListener('load', () => {
    let style = document.createElement('style');
    style.setAttribute('type', 'text/css');
    style.setAttribute('title', 'HN Timeline UserScript Styles');
    style.innerHTML = `
      .comment-timeline { position: relative; margin: 0 2rem; height: 3rem; }
      .comment-timeline > b { position: absolute; height: 3rem; background: #888; width: 1px; pointer-events: none; }
      .comment-timeline > b.mine { background: #f60; z-index: 1; width: 3px; }
      .comment-timeline > b.comm-timeline-arrow { height: 1px; top: 50%; width: 100%; }
      .comm-timeline-hidden { opacity: 0.5 }
      .comm-timeline-shadow { position: absolute; left: 0; top: 0; bottom: 0; background: #000; opacity: 0.5; z-index: 1; }
      .comm-timeline-status { margin: 0 2rem; font-size: 0.5rem; }
    `;
    document.head.append(style);

    let this_user = document.querySelector('#me')?.textContent;

    let timeline = document.createElement('div');
    timeline.className = 'comment-timeline';
    // timeline.title = 'HN Timeline (UserScript)';

    let status_text = document.createElement('div');
    status_text.className = 'comm-timeline-status';
    timeline.append(status_text);

    let shadow = document.createElement('div');
    shadow.className = 'comm-timeline-shadow';
    timeline.append(shadow);

    let arrow = document.createElement('b');
    arrow.className = 'comm-timeline-arrow';
    timeline.append(arrow);

    let comments = [...document.querySelectorAll('.comtr')];
    let commstats = comments.map(e => {
        let comm = e;
        let time = e.querySelector('.comhead > .age')?.title;
        let text = e.querySelector('.commtext')?.textContent;
        let user = e.querySelector('.comhead > .hnuser')?.textContent;
        return { user, time, text, comm };
    });

    let timestamps = commstats.map(cs => +new Date(cs.time));
    let time_min = Math.min(...timestamps);
    let time_max = Math.max(...timestamps);

    let commtexts = commstats.map(cs => cs.text.length);
    let text_min = Math.min(...commtexts);
    let text_max = Math.max(...commtexts);

    status_text.textContent = 'Comments timespan: ' + dt_text(time_max - time_min);

    for (let i = 0; i < comments.length; i++) {
        let user = commstats[i].user;
        let time = timestamps[i];
        let len = commtexts[i];
        let rel_time = (time - time_min) / (time_max - time_min);
        let rel_size = (len - text_min) / (text_max - text_min);
        rel_size = rel_size * 0.9 + 0.1;

        let dot = document.createElement('b');
        dot.classList.toggle('mine', user == this_user);
        dot.style.left = (rel_time * 100).toFixed(2) + '%';
        dot.style.top = ((1.0 - rel_size)/2 * 100).toFixed(2) + '%';
        dot.style.height = (rel_size * 100).toFixed(2) + '%';
        // dot.style.width = (100 / comments.length).toFixed(2) + '%';
        timeline.append(dot);
    }

    timeline.onclick = (e) => {
      let pos = e.offsetX / timeline.clientWidth;
      let ts = time_min + (time_max - time_min) * pos;
      console.info('min comment timestamp:', new Date(ts).toISOString());
      shadow.style.width = (pos * 100).toFixed(2) + '%';
      for (let cs of commstats)
        cs.comm.classList.toggle('comm-timeline-hidden', new Date(cs.time) < ts);

      let num_hidden = document.querySelectorAll('.comm-timeline-hidden').length;
      let num_shown = comments.length - num_hidden;
      status_text.textContent = num_shown + ' comments made after T+' + dt_text(ts - time_min);
    };

    let commtree = document.querySelector('.comment-tree');
    commtree.parentElement.insertBefore(status_text, commtree);
    commtree.parentElement.insertBefore(timeline, commtree);
});

        function dt_text(dt) {
            dt = dt/1000|0;
            return dt > 86400 ? Math.round(dt/86400) + 'd' :
            dt > 3600 ? Math.round(dt/3600) + 'h' :
            dt > 60 ? Math.round(dt/60) + 'm' :
            Math.round(dt) + 's';
        }
